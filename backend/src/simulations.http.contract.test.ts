// Cierre de la 003 (T10): CA3 (ninguna petición rechazada guarda nada), CA4 (importes enteros
// seguros sin -0) y CA6 (forma { error: { code, message, details? } } en todos los errores).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectErrorShape } from '../test/helpers/error-shape';
import { createSimulationsTestApp, insertCustomerRow, postRaw, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  vi.restoreAllMocks();
  t.close();
});

const INTEGER_KEYS = ['baseCents', 'vatCents', 'totalCents', 'vatRatePercent', 'users', 'storage', 'apiCalls'];

function expectCleanInteger(value: unknown): void {
  expect(Number.isSafeInteger(value)).toBe(true);
  expect(Object.is(value, -0)).toBe(false);
}

describe('CA4 · importes enteros seguros sin -0', () => {
  it.each([0, 1, 11, 51, 100000])('users %i', async (users) => {
    const res = await postRaw(t, `{"customerId":7,"users":${String(users)},"storage":-0,"apiCalls":-0}`);
    expect(res.status).toBe(201);
    const body = res.body as Record<string, unknown> & { tiers: Record<string, unknown>[] };
    INTEGER_KEYS.forEach((key) => {
      expectCleanInteger(body[key]);
    });
    body.tiers.forEach((tier) => {
      ['unitPriceCents', 'billedUsers', 'subtotalCents'].forEach((key) => {
        expectCleanInteger(tier[key]);
      });
    });
  });
});

const REJECTED: [string, () => request.Test][] = [
  ['400 UNKNOWN_FIELD', () => postSimulation(t, { customerId: 7, users: 15, totalCents: 1 })],
  ['400 INVALID_USERS', () => postSimulation(t, { customerId: 7, users: -1.5 })],
  ['400 INVALID_RESOURCE', () => postSimulation(t, { customerId: 7, users: 15, apiCalls: 1000001 })],
  ['400 INVALID_TYPE body', () => postRaw(t, '[]')],
  ['400 MALFORMED_JSON', () => postRaw(t, '{')],
  ['400 UNSUPPORTED_CONTENT_TYPE', () => request(t.app).post('/simulations').type('text/plain').send('x')],
  ['400 PAYLOAD_TOO_LARGE', () => postSimulation(t, { customerId: 7, users: 15, pad: 'x'.repeat(10240) })],
  ['404 CUSTOMER_NOT_FOUND', () => postSimulation(t, { customerId: 999, users: 15 })],
  ['404 NOT_FOUND', () => request(t.app).put('/simulations/1').send({ users: 1 })],
  ['400 INVALID_ID ruta', () => request(t.app).get('/simulations/01')],
  ['404 SIMULATION_NOT_FOUND', () => request(t.app).get('/simulations/424242')],
  ['404 CUSTOMER_NOT_FOUND listado', () => request(t.app).get('/customers/999/simulations')],
];

describe('CA3 y CA6 · peticiones rechazadas', () => {
  it.each(REJECTED)('%s: forma de error y 0 filas nuevas', async (_name, send) => {
    expectErrorShape(await send());
    expect(t.countSimulations()).toBe(0);
  });

  it('500 INTERNAL_ERROR (RF12): forma de error y 0 filas nuevas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    insertCustomerRow(t, 50, 'XX');
    const res = await postSimulation(t, { customerId: 50, users: 15 });
    expect(expectErrorShape(res)).toBe('INTERNAL_ERROR');
    expect(t.countSimulations()).toBe(0);
  });

  it('con una simulación previa, los rechazos no añaden filas', async () => {
    await postSimulation(t, { customerId: 7, users: 15 });
    for (const [, send] of REJECTED) {
      const res = await send();
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
    expect(t.countSimulations()).toBe(1);
  });
});
