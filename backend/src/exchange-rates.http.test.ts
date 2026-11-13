// GET /exchange-rates (RF18 de la 004, RF5 y RF8 de la 007): tabla "GET /exchange-rates". Proveedor y reloj falsos, sin red.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { providerDown } from '../test/helpers/fake-rates';
import { createTestApp, FIXED_NOW } from '../test/helpers/test-app';
import type { TestApp } from '../test/helpers/test-app';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

const ITEMS = [
  { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: FIXED_NOW },
  { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: FIXED_NOW },
  { currency: 'CHF', exchangeRate: '0.950000', exchangeRateAt: FIXED_NOW },
];

describe('GET /exchange-rates (RF18)', () => {
  it('con la caché vacía y la API operativa devuelve USD, GBP y CHF, en el orden de la lista, con el mismo instante', async () => {
    const res = await request(t.app).get('/exchange-rates');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: ITEMS });
    expect(t.rates.calls).toEqual(['fetch']);
  });

  it('con la caché vigente no llama a la API', async () => {
    await request(t.app).get('/exchange-rates');
    const res = await request(t.app).get('/exchange-rates');
    expect(res.body).toEqual({ items: ITEMS });
    expect(t.rates.calls).toHaveLength(1);
  });

  it('omite la divisa ausente (SEK) o inválida (NOK) y el resto sigue, sin llamar de nuevo', async () => {
    t.rates.answers.SEK = '1e1';
    t.rates.answers.NOK = 'abc';
    const first = await request(t.app).get('/exchange-rates');
    const second = await request(t.app).get('/exchange-rates');
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ items: ITEMS });
    expect(second.body).toEqual(first.body);
    expect(t.rates.calls).toHaveLength(1);
  });

  it('con el proveedor caído da 500 EXCHANGE_RATE_UNAVAILABLE sin filtrar datos internos', async () => {
    t.rates.failure = providerDown();
    const res = await request(t.app).get('/exchange-rates');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'EXCHANGE_RATE_UNAVAILABLE',
        message: 'No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde.',
      },
    });
    expect(res.text).not.toMatch(/SECRET|secret.example|apikey/);
  });

  it('sin ninguna divisa válida da 500 y a los 30 s no vuelve a llamar al proveedor (enfriamiento)', async () => {
    t.rates.answers = { USD: '0', GBP: 'x' };
    expect((await request(t.app).get('/exchange-rates')).status).toBe(500);
    t.setNow(new Date(new Date(FIXED_NOW).getTime() + 30_000));
    t.rates.answers = { USD: '1.1' };
    expect((await request(t.app).get('/exchange-rates')).status).toBe(500);
    expect(t.rates.calls).toHaveLength(1);
    t.setNow(new Date(new Date(FIXED_NOW).getTime() + 61_000));
    expect((await request(t.app).get('/exchange-rates')).status).toBe(200);
    expect(t.rates.calls).toHaveLength(2);
  });

  it('ignora los parámetros de consulta', async () => {
    const res = await request(t.app).get('/exchange-rates?currency=USD');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: ITEMS });
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    '%s /exchange-rates con JSON no válido da 404 NOT_FOUND, no 400',
    async (method) => {
      const res = await request(t.app)[method]('/exchange-rates').set('Content-Type', 'application/json').send('{');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } });
      expect(t.rates.calls).toEqual([]);
    },
  );
});
