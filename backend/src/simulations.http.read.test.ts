// GET /simulations/:id y GET /customers/:id/simulations (T9). Tabla "Consultas": RF14–RF18.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSimulationsTestApp, fieldsOf, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  t.close();
});

const get = (path: string): request.Test => request(t.app).get(path);

/** El reloj de pruebas es fijo: se reescribe created_at para controlar el orden. */
function setCreatedAt(id: number, createdAt: string): void {
  t.db.prepare('UPDATE simulations SET created_at = ? WHERE id = ?').run(createdAt, id);
}

function idsOf(res: request.Response): number[] {
  return (res.body as { items: { id: number }[] }).items.map((s) => s.id);
}

describe('RF14–RF15 · detalle', () => {
  it('GET /simulations/1 es idéntica a la respuesta del alta', async () => {
    const created = await postSimulation(t, { customerId: 7, users: 15, storage: 50 });
    const res = await get('/simulations/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('GET /simulations/424242 → 404 SIMULATION_NOT_FOUND', async () => {
    const res = await get('/simulations/424242');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'SIMULATION_NOT_FOUND', message: 'No existe la simulación 424242.' },
    });
  });

  it.each(['0', '-1', 'abc', '01', '1.5', '9007199254740992'])(
    'GET /simulations/%s → 400 INVALID_ID',
    async (id) => {
      const res = await get(`/simulations/${id}`);
      expect(res.status).toBe(400);
      expect(fieldsOf(res)).toEqual([{ field: 'id', code: 'INVALID_ID' }]);
    },
  );

  it('ignora los parámetros de consulta (RF18)', async () => {
    const created = await postSimulation(t, { customerId: 7, users: 3 });
    const res = await get('/simulations/1?recalc=true');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });
});

describe('RF16–RF18 · listado por cliente', () => {
  async function seed(): Promise<void> {
    for (const users of [1, 2, 3, 4, 5]) await postSimulation(t, { customerId: 7, users });
    await postSimulation(t, { customerId: 8, users: 9 });
    setCreatedAt(1, '2026-11-10T10:00:00.000Z');
    setCreatedAt(2, '2026-11-12T10:00:00.000Z');
    setCreatedAt(3, '2026-11-11T10:00:00.000Z');
    setCreatedAt(4, '2026-11-13T10:00:00.000Z');
    setCreatedAt(5, '2026-11-13T10:00:00.000Z');
  }

  it('ordena por createdAt DESC, desempata por id DESC y excluye al cliente 8', async () => {
    await seed();
    const res = await get('/customers/7/simulations');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body as object)).toEqual(['items']);
    expect(idsOf(res)).toEqual([5, 4, 2, 3, 1]);
  });

  it('cada elemento es igual al detalle', async () => {
    await seed();
    const res = await get('/customers/7/simulations');
    const detail = await get('/simulations/3');
    expect((res.body as { items: unknown[] }).items[3]).toEqual(detail.body);
  });

  it('ignora ?page=2&limit=1 (RF18)', async () => {
    await seed();
    const res = await get('/customers/7/simulations?page=2&limit=1');
    expect(res.status).toBe(200);
    expect(idsOf(res)).toEqual([5, 4, 2, 3, 1]);
  });

  it('cliente sin simulaciones → { items: [] }', async () => {
    const res = await get('/customers/8/simulations');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });

  it('cliente inexistente → 404 CUSTOMER_NOT_FOUND', async () => {
    const res = await get('/customers/999/simulations');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'CUSTOMER_NOT_FOUND', message: 'No existe el cliente 999.' },
    });
  });

  it.each(['abc', '0', '01'])('GET /customers/%s/simulations → 400 INVALID_ID', async (id) => {
    const res = await get(`/customers/${id}/simulations`);
    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual([{ field: 'id', code: 'INVALID_ID' }]);
  });
});
