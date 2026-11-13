// Divisa en el alta (004): tablas "Validación de currency" y "Tramos e IVA en otra divisa".
// Proveedor falso (USD 1,10 y GBP 0,85) y reloj fijo: ninguna petición va a la red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSimulationsTestApp, fieldsOf, insertCustomerRow, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
  insertCustomerRow(t, 9, 'PT');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

async function rejected(body: Record<string, unknown>, status: number) {
  const res = await postSimulation(t, body);
  expect(res.status).toBe(status);
  expect(t.countSimulations()).toBe(0);
  return res;
}

describe('currency ausente o EUR (RF2)', () => {
  it.each([[undefined], ['EUR']])('currency %j guarda EUR, tipo 1.000000 y no llama a la API', async (currency) => {
    const res = await postSimulation(t, { customerId: 7, users: 15, currency });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      currency: 'EUR', exchangeRate: '1.000000', exchangeRateAt: '2026-11-12T10:00:00.000Z',
      convertedBaseCents: 14000, convertedVatCents: 2940, convertedTotalCents: 16940,
    });
    expect(t.rates.calls).toEqual([]);
  });

  it('con la API caída, EUR sigue dando 201 sin llamarla', async () => {
    t.rates.answers.USD = new Error('caída');
    expect((await postSimulation(t, { customerId: 7, users: 15 })).status).toBe(201);
    expect(t.rates.calls).toEqual([]);
  });
});

describe('validación de currency (RF13)', () => {
  it.each([['JPY'], ['CHF'], ['MXN'], ['XXX']])('%s da CURRENCY_NOT_AVAILABLE con suggestion', async (currency) => {
    const res = await rejected({ customerId: 7, users: 15, currency }, 400);
    expect(res.body).toMatchObject({
      error: { details: { fields: [{ field: 'currency', code: 'CURRENCY_NOT_AVAILABLE', suggestion: 'EUR, USD, GBP' }] } },
    });
    expect(t.rates.calls).toEqual([]);
  });

  it.each([['usd'], ['Usd'], [' USD '], ['   '], [''], ['USD\n'], ['US'], ['USDD'], ['U$D'], ['123']])(
    '%j da INVALID_CURRENCY',
    async (currency) => {
      expect(fieldsOf(await rejected({ customerId: 7, users: 15, currency }, 400))).toEqual([
        { field: 'currency', code: 'INVALID_CURRENCY' },
      ]);
    },
  );

  it.each([[null], [34], [true], [{}], [['USD']]])('%j da INVALID_TYPE', async (currency) => {
    expect(fieldsOf(await rejected({ customerId: 7, users: 15, currency }, 400))).toEqual([
      { field: 'currency', code: 'INVALID_TYPE' },
    ]);
  });

  it('cuatro errores en el orden customerId, users, currency, foo', async () => {
    const res = await rejected({ customerId: 'x', users: -1, currency: 'JPY', foo: 1 }, 400);
    expect(fieldsOf(res).map((f) => f.field)).toEqual(['customerId', 'users', 'currency', 'foo']);
  });

  it('tres errores en el orden storage, apiCalls, currency', async () => {
    const res = await rejected({ customerId: 7, users: 15, storage: -1, apiCalls: -1, currency: 'JPY' }, 400);
    expect(fieldsOf(res).map((f) => f.field)).toEqual(['storage', 'apiCalls', 'currency']);
  });

  it('cliente 999 con JPY es 400 (se valida antes que el cliente)', async () => {
    await rejected({ customerId: 999, users: 15, currency: 'JPY' }, 400);
  });

  it('cliente 999 con USD es 404 CUSTOMER_NOT_FOUND sin llamar a la API', async () => {
    const res = await rejected({ customerId: 999, users: 15, currency: 'USD' }, 404);
    expect(res.body).toMatchObject({ error: { code: 'CUSTOMER_NOT_FOUND' } });
    expect(t.rates.calls).toEqual([]);
  });

  it('exchangeRate en el cuerpo es UNKNOWN_FIELD (RF3)', async () => {
    const res = await rejected({ customerId: 7, users: 15, currency: 'USD', exchangeRate: '2' }, 400);
    expect(fieldsOf(res)).toEqual([{ field: 'exchangeRate', code: 'UNKNOWN_FIELD' }]);
  });

  it('un cliente con país XX da 500 INTERNAL_ERROR, sin llamar a la API ni guardar (RF14)', async () => {
    insertCustomerRow(t, 10, 'XX');
    const res = await rejected({ customerId: 10, users: 15, currency: 'USD' }, 500);
    expect(res.body).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    expect(t.rates.calls).toEqual([]);
  });
});

const TABLE: [number, number, number, number, number][] = [
  [7, 0, 0, 0, 0],
  [7, 1, 1100, 231, 1331],
  [7, 10, 11000, 2310, 13310],
  [7, 11, 11880, 2495, 14375],
  [7, 15, 15400, 3234, 18634],
  [7, 50, 46200, 9702, 55902],
  [7, 51, 46750, 9818, 56568],
  [7, 100_000, 55_018_700, 11_553_927, 66_572_627],
  [9, 100_000, 55_018_700, 12_654_301, 67_673_001],
  [8, 15, 15400, 0, 15400],
];

describe('tramos e IVA en USD con tipo 1,10 (RF4-RF7)', () => {
  it.each(TABLE)('cliente %i con %i usuarios', async (customerId, users, base, vat, total) => {
    const res = await postSimulation(t, { customerId, users, currency: 'USD' });
    expect(res.status).toBe(201);
    const b = res.body as Record<string, number>;
    expect([b['convertedBaseCents'], b['convertedVatCents'], b['convertedTotalCents']]).toEqual([base, vat, total]);
    for (const v of [base, vat, total]) expect(Object.is(v, -0)).toBe(false);
    const euros = (await postSimulation(t, { customerId, users })).body as Record<string, unknown>;
    for (const key of ['tiers', 'baseCents', 'vatCents', 'totalCents', 'vatRatePercent']) {
      expect(b[key]).toEqual(euros[key]);
    }
  });

  it('GBP con 11 usuarios usa el tipo 0,85 y solo pide GBP', async () => {
    const res = await postSimulation(t, { customerId: 7, users: 11, currency: 'GBP' });
    expect(res.body).toMatchObject({ currency: 'GBP', exchangeRate: '0.850000', convertedBaseCents: 9180 });
    expect(t.rates.calls).toEqual(['GBP']);
  });
});
