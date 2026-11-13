// POST /simulations: altas válidas (T8). Tabla "Alta: tramos e IVA", forma normativa, RF1–RF4
// y la paridad con calculateQuote (CA2).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { calculateQuote } from '@saas-o-matic/shared';
import { FIXED_NOW } from '../test/helpers/test-app';
import { createSimulationsTestApp, insertCustomerRow, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  t.close();
});

const SHAPE_KEYS = [
  'id',
  'customerId',
  'users',
  'storage',
  'apiCalls',
  'tiers',
  'baseCents',
  'country',
  'vatRatePercent',
  'vatCents',
  'totalCents',
  'currency',
  'exchangeRate',
  'exchangeRateAt',
  'convertedBaseCents',
  'convertedVatCents',
  'convertedTotalCents',
  'createdAt',
];

describe('RF1 · forma normativa', () => {
  it('responde 201 con el ejemplo exacto de la spec', async () => {
    const res = await postSimulation(t, {
      customerId: 7,
      users: 15,
      storage: 50,
    });
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(Object.keys(res.body as object).sort()).toEqual([...SHAPE_KEYS].sort());
    expect(res.body).toEqual({
      id: 1,
      customerId: 7,
      users: 15,
      storage: 50,
      apiCalls: 0,
      tiers: [
        {
          tier: 1,
          from: 1,
          to: 10,
          unitPriceCents: 1000,
          billedUsers: 10,
          subtotalCents: 10000,
        },
        {
          tier: 2,
          from: 11,
          to: 50,
          unitPriceCents: 800,
          billedUsers: 5,
          subtotalCents: 4000,
        },
        {
          tier: 3,
          from: 51,
          to: null,
          unitPriceCents: 500,
          billedUsers: 0,
          subtotalCents: 0,
        },
      ],
      baseCents: 14000,
      country: 'ES',
      vatRatePercent: 21,
      vatCents: 2940,
      totalCents: 16940,
      currency: 'EUR',
      exchangeRate: '1.000000',
      exchangeRateAt: FIXED_NOW,
      convertedBaseCents: 14000,
      convertedVatCents: 2940,
      convertedTotalCents: 16940,
      createdAt: FIXED_NOW,
    });
    expect(t.countSimulations()).toBe(1);
  });

  it('asigna ids crecientes', async () => {
    await postSimulation(t, { customerId: 7, users: 1 });
    const res = await postSimulation(t, { customerId: 8, users: 1 });
    expect(res.body).toMatchObject({ id: 2, customerId: 8 });
  });
});

// [customerId, users, base, iva, total] en céntimos.
const TIER_ROWS: readonly (readonly [number, number, number, number, number])[] = [
  [7, 0, 0, 0, 0],
  [7, 1, 1000, 210, 1210],
  [7, 10, 10000, 2100, 12100],
  [7, 11, 10800, 2268, 13068],
  [7, 50, 42000, 8820, 50820],
  [7, 51, 42500, 8925, 51425],
  [7, 100000, 50017000, 10503570, 60520570],
  [8, 15, 14000, 0, 14000],
];

describe('Alta: tramos e IVA de extremo a extremo', () => {
  it.each(TIER_ROWS)('cliente %i con %i usuarios', async (customerId, users, base, vat, total) => {
    const res = await postSimulation(t, { customerId, users });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      baseCents: base,
      vatCents: vat,
      totalCents: total,
      storage: 0,
      apiCalls: 0,
    });
    const country = customerId === 7 ? 'ES' : 'US';
    const quote = calculateQuote({ users, country });
    if (!quote.ok) throw new Error('calculateQuote debería aceptar la fila');
    expect(res.body).toMatchObject(quote.value);
    expect(res.body).toMatchObject({
      country,
      vatRatePercent: country === 'ES' ? 21 : 0,
    });
  });

  it('recursos al máximo no cambian el precio (RF3)', async () => {
    const res = await postSimulation(t, {
      customerId: 7,
      users: 15,
      storage: 1000000,
      apiCalls: 1000000,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      storage: 1000000,
      apiCalls: 1000000,
      baseCents: 14000,
      vatCents: 2940,
      totalCents: 16940,
    });
  });

  it('el plan del cliente no influye (D9)', async () => {
    insertCustomerRow(t, 20, 'ES', 'starter');
    insertCustomerRow(t, 21, 'ES', 'enterprise');
    const a = await postSimulation(t, { customerId: 20, users: 15 });
    const b = await postSimulation(t, { customerId: 21, users: 15 });
    const pick = (body: Record<string, unknown>) => [body.tiers, body.baseCents, body.vatCents, body.totalCents];
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(pick(a.body as Record<string, unknown>)).toEqual(pick(b.body as Record<string, unknown>));
  });

  it('el alta queda guardada igual que la respuesta', async () => {
    const res = await postSimulation(t, { customerId: 7, users: 11 });
    const stored = t.db.prepare('SELECT base_cents, vat_cents, total_cents FROM simulations').get();
    expect(stored).toEqual({
      base_cents: 10800,
      vat_cents: 2268,
      total_cents: 13068,
    });
    expect(res.body).toMatchObject({ vatCents: 2268 });
  });
});
