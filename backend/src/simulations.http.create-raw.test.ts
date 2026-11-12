// POST /simulations (T8): claves duplicadas, -0 y extremos de recursos aceptados, y RF12
// (500 con un cliente de país XX insertado directamente).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSimulationsTestApp, insertCustomerRow, postRaw, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

describe('Alta: JSON crudo y valores límite aceptados', () => {
  it('clave duplicada: gana la última users (15)', async () => {
    const res = await postRaw(t, '{"customerId": 7, "users": 999999, "users": 15}');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ users: 15, baseCents: 14000 });
  });

  it('storage -0 se guarda y devuelve como +0', async () => {
    const res = await postRaw(t, '{"customerId": 7, "users": 15, "storage": -0}');
    expect(res.status).toBe(201);
    const body = res.body as { storage: number };
    expect(Object.is(body.storage, 0)).toBe(true);
    expect(res.text).toContain('"storage":0');
  });

  it.each(['storage', 'apiCalls'])('%s acepta 0 y 1000000', async (field) => {
    for (const value of [0, 1000000]) {
      const res = await postSimulation(t, {
        customerId: 7,
        users: 15,
        [field]: value,
      });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ [field]: value });
    }
  });

  it('apiCalls -0 también se acepta', async () => {
    const res = await postRaw(t, '{"customerId": 7, "users": 15, "apiCalls": -0}');
    expect(res.status).toBe(201);
    expect(res.text).toContain('"apiCalls":0');
  });
});

describe('RF12 · cliente con país XX', () => {
  it('500 INTERNAL_ERROR sin details, sin filas y con console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    insertCustomerRow(t, 30, 'XX');
    const res = await postSimulation(t, { customerId: 30, users: 15 });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' },
    });
    expect(t.countSimulations()).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
