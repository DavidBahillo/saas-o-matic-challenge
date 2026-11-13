// Spec 005 · T1: simulationCount del cliente (RF1 a RF3) y paridad con calculateQuote (CA2).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { calculateQuote } from '@saas-o-matic/shared';
import { createSimulationsTestApp, insertCustomerRow, postSimulation } from './helpers/simulations-app';
import type { SimulationsTestApp } from './helpers/simulations-app';
import { createTestApp } from './helpers/test-app';
import { seedNames } from './helpers/seed-customers';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  t.close();
});

async function countOf(id: number): Promise<number> {
  const res = await request(t.app).get(`/customers/${String(id)}`);
  return (res.body as { simulationCount: number }).simulationCount;
}

async function save(customerId: number): Promise<number> {
  return (await postSimulation(t, { customerId, users: 5, storage: 0, apiCalls: 0, currency: 'EUR' })).status;
}

describe('RF1 · simulationCount en las lecturas', () => {
  it('0, 1 y 3 en GET /customers/:id, GET /customers y GET /customers?q=', async () => {
    await save(7);
    for (let i = 0; i < 3; i += 1) await save(8);
    insertCustomerRow(t, 9, 'ES');
    expect(await countOf(7)).toBe(1);
    expect(await countOf(8)).toBe(3);
    expect(await countOf(9)).toBe(0);
    const list = await request(t.app).get('/customers');
    const items = (list.body as { items: { id: number; simulationCount: number }[] }).items;
    expect(items.map((c) => [c.id, c.simulationCount])).toEqual([[7, 1], [8, 3], [9, 0]]);
    const found = await request(t.app).get('/customers?q=cliente 8');
    expect((found.body as { items: { simulationCount: number }[] }).items[0]?.simulationCount).toBe(3);
  });

  it('el 201 de POST /customers trae 0', async () => {
    const res = await request(t.app)
      .post('/customers')
      .send({ companyName: 'Nueva SL', taxId: 'B12345674', email: 'a@b.es', country: 'ES', plan: 'starter' });
    expect(res.status).toBe(201);
    expect((res.body as { simulationCount: number }).simulationCount).toBe(0);
  });

  it('simulationCount en el cuerpo del alta da 400 UNKNOWN_FIELD', async () => {
    const res = await request(t.app)
      .post('/customers')
      .send({ companyName: 'Nueva SL', taxId: 'B12345674', email: 'a@b.es', country: 'ES', plan: 'starter', simulationCount: 5 });
    expect(res.status).toBe(400);
    const body = res.body as { error: { details: { fields: { field: string; code: string }[] } } };
    expect(body.error.details.fields).toContainEqual(expect.objectContaining({ field: 'simulationCount', code: 'UNKNOWN_FIELD' }));
  });
});

describe('RF2 · el contador solo sube con un 201', () => {
  it('sube en 1 tras una simulación válida y no cambia tras 400, 404 o 500', async () => {
    expect(await save(7)).toBe(201);
    expect(await countOf(7)).toBe(1);
    const bad = await postSimulation(t, { customerId: 7, users: -1, storage: 0, apiCalls: 0, currency: 'EUR' });
    expect(bad.status).toBe(400);
    expect(await save(999)).toBe(404);
    t.rates.answers.USD = new Error('caído');
    const down = await postSimulation(t, { customerId: 7, users: 5, storage: 0, apiCalls: 0, currency: 'USD' });
    expect(down.status).toBe(500);
    expect(await countOf(7)).toBe(1);
  });
});

describe('RF3 · orden, total y límite no cambian; sin columna nueva', () => {
  it('mantiene el orden por colación y el límite de 50 con total', async () => {
    const u = createTestApp();
    seedNames(u, ['Zeta', 'árbol', 'Beta']);
    for (let i = 0; i < 50; i += 1) seedNames(u, [`Cliente ${String(i).padStart(2, '0')}`]);
    const res = await request(u.app).get('/customers');
    const body = res.body as { items: { companyName: string }[]; total: number };
    expect(body.total).toBe(53);
    expect(body.items).toHaveLength(50);
    expect(body.items.slice(0, 2).map((c) => c.companyName)).toEqual(['árbol', 'Beta']);
    u.close();
  });

  it('la tabla customers no tiene columna de contador', () => {
    const cols = t.db.prepare<[], { name: string }>('PRAGMA table_info(customers)').all();
    expect(cols.map((c) => c.name).some((n) => n.includes('simulation'))).toBe(false);
  });
});

describe('CA2 · paridad con calculateQuote en EUR', () => {
  const COUNTRY_CUSTOMER = { ES: 7, US: 8, PT: 10 } as const;
  const cases = [0, 1, 10, 11, 50, 51].flatMap((users) =>
    (['ES', 'PT', 'US'] as const).map((country) => [users, country] as const),
  );

  it.each(cases)('%i usuarios en %s coincide con calculateQuote', async (users, country) => {
    insertCustomerRow(t, 10, 'PT');
    const customerId = COUNTRY_CUSTOMER[country];
    const res = await postSimulation(t, { customerId, users, storage: 0, apiCalls: 0, currency: 'EUR' });
    const quote = calculateQuote({ users, country });
    if (!quote.ok) throw new Error('calculateQuote debería aceptar la fila');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(quote.value);
  });
});
