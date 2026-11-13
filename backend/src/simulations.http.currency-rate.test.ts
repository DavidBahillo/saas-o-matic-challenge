// Tipo de cambio en el alta (004): tablas "Tipo de cambio: formato, rango y API" y "Caché, tiempo y
// concurrencia". Proveedor y reloj falsos: ninguna petición va a la red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { providerDown } from '../test/helpers/fake-rates';
import { FIXED_NOW } from '../test/helpers/test-app';
import { createSimulationsTestApp, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;
const T0 = new Date(FIXED_NOW).getTime();
const DAY = 86_400_000;
const USD = { customerId: 7, users: 1, currency: 'USD' };
const UNAVAILABLE = {
  error: {
    code: 'EXCHANGE_RATE_UNAVAILABLE',
    message: 'No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde.',
  },
};

beforeEach(() => {
  t = createSimulationsTestApp();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

async function expectUnavailable(): Promise<void> {
  const res = await postSimulation(t, USD);
  expect(res.status).toBe(500);
  expect(res.body).toEqual(UNAVAILABLE);
  expect(res.text).not.toMatch(/SECRET|secret\.example|apikey/);
  expect(t.countSimulations()).toBe(0);
}

describe('formato y rango del tipo (RF11, RF12)', () => {
  it.each([
    ['1.1', '1.100000'],
    ['1.1234567', '1.123457'],
    ['0.0099996', '0.010000'],
    ['0.01', '0.010000'],
    ['100', '100.000000'],
    ['100.0000004', '100.000000'],
  ])('la API devuelve %s y se guarda %s', async (api, stored) => {
    t.rates.answers.USD = api;
    const res = await postSimulation(t, USD);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ exchangeRate: stored });
  });

  it.each([['0.0099994'], ['100.0000005'], ['0'], ['-1'], ['1e0'], ['abc'], [''], ['null'], ['NaN']])(
    'la API devuelve %j: 500 EXCHANGE_RATE_UNAVAILABLE, sin guardar ni cachear',
    async (api) => {
      t.rates.answers.USD = api;
      await expectUnavailable();
      t.rates.answers.USD = '1.1';
      expect((await postSimulation(t, USD)).status).toBe(201);
      expect(t.rates.calls).toHaveLength(2);
    },
  );

  it('tipo 100 con 100 000 usuarios ES en USD: producto exacto en enteros seguros', async () => {
    t.rates.answers.USD = '100';
    const res = await postSimulation(t, { customerId: 7, users: 100_000, currency: 'USD' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ convertedBaseCents: 5_001_700_000, convertedVatCents: 1_050_357_000 });
  });

  it.each(['USD', 'GBP'])('si la API falla (red, timeout o dato inválido) con %s, 500 sin filtrar la causa', async (c) => {
    t.rates.answers.USD = providerDown();
    t.rates.answers.GBP = providerDown();
    const res = await postSimulation(t, { ...USD, currency: c });
    expect(res.body).toEqual(UNAVAILABLE);
    expect(res.text).not.toMatch(/SECRET|secret\.example|apikey/);
    expect(t.countSimulations()).toBe(0);
  });

  it('GBP con la API que solo tiene USD da 500', async () => {
    t.rates.answers.GBP = providerDown();
    expect((await postSimulation(t, { ...USD, currency: 'GBP' })).status).toBe(500);
  });
});

describe('caché, tiempo y concurrencia (RF15-RF17)', () => {
  it('con el tipo de hace 23 h 59 min 59,999 s no llama a la API y conserva su instante', async () => {
    await postSimulation(t, USD);
    t.setNow(new Date(T0 + DAY - 1));
    const res = await postSimulation(t, USD);
    expect(res.body).toMatchObject({ exchangeRateAt: FIXED_NOW });
    expect(t.rates.calls).toHaveLength(1);
  });

  it('con exactamente 24 h renueva y usa el tipo nuevo', async () => {
    await postSimulation(t, USD);
    t.rates.answers.USD = '1.2';
    t.setNow(new Date(T0 + DAY));
    const res = await postSimulation(t, USD);
    expect(res.body).toMatchObject({ exchangeRate: '1.200000', exchangeRateAt: new Date(T0 + DAY).toISOString() });
  });

  it('con 24 h o más y la API caída da 500 y no usa el tipo caducado', async () => {
    await postSimulation(t, USD);
    t.rates.answers.USD = providerDown();
    t.setNow(new Date(T0 + DAY));
    const before = t.countSimulations();
    expect((await postSimulation(t, USD)).status).toBe(500);
    expect(t.countSimulations()).toBe(before);
  });

  it('con el reloj hacia atrás el tipo no es vigente: renueva y, si falla, 500 (V4)', async () => {
    await postSimulation(t, USD);
    t.setNow(new Date(T0 - 3_600_000));
    await postSimulation(t, USD);
    expect(t.rates.calls).toHaveLength(2);
    t.rates.answers.USD = providerDown();
    t.setNow(new Date(T0 - 7_200_000));
    expect((await postSimulation(t, USD)).status).toBe(500);
  });

  it('cada divisa tiene su caché: con USD vigente solo se llama por GBP', async () => {
    await postSimulation(t, USD);
    await postSimulation(t, { ...USD, currency: 'GBP' });
    expect(t.rates.calls).toEqual(['USD', 'GBP']);
  });

  it('dos POST simultáneos con la caché vacía dan 201 con un par (tipo, instante) válido', async () => {
    const [a, b] = await Promise.all([postSimulation(t, USD), postSimulation(t, USD)]);
    for (const res of [a, b]) {
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ exchangeRate: '1.100000', exchangeRateAt: FIXED_NOW });
    }
  });

  it('dos POST simultáneos con la API caída dan 500 y no guardan nada', async () => {
    t.rates.answers.USD = providerDown();
    const [a, b] = await Promise.all([postSimulation(t, USD), postSimulation(t, USD)]);
    expect([a.status, b.status]).toEqual([500, 500]);
    expect(t.countSimulations()).toBe(0);
  });

  it('tras un reinicio la caché está vacía y el primer POST llama a la API', async () => {
    await postSimulation(t, USD);
    const restarted = createSimulationsTestApp();
    try {
      await postSimulation(restarted, USD);
      expect(restarted.rates.calls).toEqual(['USD']);
    } finally {
      restarted.close();
    }
  });
});
