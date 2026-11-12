// Rutas y métodos no definidos e inmutabilidad (T9). Tabla "Inmutabilidad y congelación": RF19–RF20.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSimulationsTestApp, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;
let original: unknown;

beforeEach(async () => {
  t = createSimulationsTestApp();
  original = (await postSimulation(t, { customerId: 7, users: 15, storage: 50 })).body;
});

afterEach(() => {
  t.close();
});

const NOT_FOUND = { error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } };
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const CASES: [Method, string][] = [
  ['get', '/simulations'],
  ['delete', '/simulations'],
  ['put', '/simulations'],
  ['patch', '/simulations'],
  ['post', '/simulations/1'],
  ['put', '/simulations/1'],
  ['patch', '/simulations/1'],
  ['delete', '/simulations/1'],
  ['post', '/customers/7/simulations'],
  ['put', '/customers/7/simulations'],
  ['patch', '/customers/7/simulations'],
  ['delete', '/customers/7/simulations'],
];

async function currentDetail(): Promise<unknown> {
  return (await request(t.app).get('/simulations/1')).body;
}

describe('RF19 · sin edición ni borrado', () => {
  it.each(CASES)('%s %s → 404 NOT_FOUND y la simulación sigue intacta', async (method, path) => {
    const agent = request(t.app);
    const res = await agent[method](path)
      .set('Content-Type', 'application/json')
      .send('{"customerId":8,"users":99}');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
    expect(t.countSimulations()).toBe(1);
    expect(await currentDetail()).toEqual(original);
  });

  it('PUT /simulations/1 con JSON no válido → 404, no 400', async () => {
    const res = await request(t.app)
      .put('/simulations/1')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
    expect(await currentDetail()).toEqual(original);
  });
});

describe('RF20 · congelación', () => {
  it('una fila con baseCents 99900 se devuelve sin recalcular', async () => {
    t.db
      .prepare(
        'UPDATE simulations SET base_cents = 99900, vat_cents = 20979, total_cents = 120879 WHERE id = 1',
      )
      .run();
    const expected = { ...(original as object), baseCents: 99900, vatCents: 20979, totalCents: 120879 };
    expect(await currentDetail()).toEqual(expected);
    const list = await request(t.app).get('/customers/7/simulations');
    expect(list.body).toEqual({ items: [expected] });
  });
});
