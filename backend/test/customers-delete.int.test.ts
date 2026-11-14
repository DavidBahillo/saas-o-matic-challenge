// DELETE /customers/:id (009, RF20 a RF29): borrado en cascada, 404 posteriores y re-alta.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSimulationsTestApp } from './helpers/simulations-app';
import type { SimulationsTestApp } from './helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  t.close();
});

async function simulate(customerId: number, n: number): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const res = await request(t.app).post('/simulations').set('Content-Type', 'application/json')
      .send(JSON.stringify({ customerId, users: 5, storage: 0, apiCalls: 0, currency: 'EUR' }));
    expect(res.status).toBe(201);
    ids.push((res.body as { id: number }).id);
  }
  return ids;
}

function code(res: request.Response): string {
  return (res.body as { error: { code: string } }).error.code;
}

describe('DELETE /customers/:id', () => {
  it.each([0, 1, 14])('con %d simulaciones → 200 { deletedSimulations } y no quedan filas', async (n) => {
    await simulate(7, n);
    await simulate(8, 2);
    const res = await request(t.app).delete('/customers/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deletedSimulations: n });
    expect(t.countSimulations()).toBe(2);
    expect(t.repository.findById(7)).toBeUndefined();
  });

  it('tras borrar, detalle y simulaciones del cliente dan 404 CUSTOMER_NOT_FOUND', async () => {
    const [simId] = await simulate(7, 1);
    await request(t.app).delete('/customers/7');
    const detail = await request(t.app).get('/customers/7');
    const list = await request(t.app).get('/customers/7/simulations');
    expect([detail.status, code(detail)]).toEqual([404, 'CUSTOMER_NOT_FOUND']);
    expect([list.status, code(list)]).toEqual([404, 'CUSTOMER_NOT_FOUND']);
    const one = await request(t.app).get(`/simulations/${String(simId)}`);
    expect([one.status, code(one)]).toEqual([404, 'SIMULATION_NOT_FOUND']);
  });

  it('un segundo borrado → 404 CUSTOMER_NOT_FOUND', async () => {
    await request(t.app).delete('/customers/7');
    const res = await request(t.app).delete('/customers/7');
    expect([res.status, code(res)]).toEqual([404, 'CUSTOMER_NOT_FOUND']);
  });

  it.each(['0', '-1', 'abc', '007'])('id %s → 400 INVALID_ID', async (id) => {
    const res = await request(t.app).delete(`/customers/${id}`);
    expect(res.status).toBe(400);
    const fields = (res.body as { error: { details: { fields: { code: string }[] } } }).error.details.fields;
    expect(fields[0]?.code).toBe('INVALID_ID');
  });

  it('permite dar de alta otro cliente con el mismo país y NIF', async () => {
    t.db.exec(`UPDATE customers SET tax_id = 'B12345674', tax_id_type = 'CIF' WHERE id = 7`);
    await request(t.app).delete('/customers/7');
    const res = await request(t.app).post('/customers').set('Content-Type', 'application/json')
      .send(JSON.stringify({ companyName: 'Nueva', taxId: 'B12345674', email: 'a@b.es', country: 'ES', plan: 'starter' }));
    expect(res.status).toBe(201);
  });

  it('el borrado y las demás altas siguen funcionando con el contador de la lista', async () => {
    await simulate(8, 3);
    const list = await request(t.app).get('/customers');
    const items = (list.body as { items: { id: number; simulationCount: number }[] }).items;
    expect(items.find((c) => c.id === 8)?.simulationCount).toBe(3);
  });
});
