// PUT /customers/:id (009, RF10 a RF18): mismo esquema del alta, 409 frente a otro cliente, 404 e INVALID_ID.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_REQUEST, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { createSimulationsTestApp } from './helpers/simulations-app';

let t: TestApp;

const BODY = { companyName: 'Acme Iberia SL', country: 'ES', taxId: ' 12345678-z ', email: 'ops@acme.es', plan: 'enterprise' };

beforeEach(async () => {
  t = createTestApp();
  await post(CONTRACT_REQUEST);
});

afterEach(() => {
  t.close();
});

function post(body: unknown): request.Test {
  return request(t.app).post('/customers').set('Content-Type', 'application/json').send(JSON.stringify(body));
}

function put(id: string | number, body: unknown, raw = false): request.Test {
  return request(t.app)
    .put(`/customers/${String(id)}`)
    .set('Content-Type', 'application/json')
    .send(raw ? (body as string) : JSON.stringify(body));
}

function code(res: request.Response): string {
  return (res.body as { error: { code: string } }).error.code;
}

describe('PUT válido', () => {
  it('200 con el cliente actualizado, id y fecha de alta conservados, NIF normalizado y tipo recalculado', async () => {
    const res = await put(1, BODY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1, companyName: 'Acme Iberia SL', taxId: '12345678Z', taxIdType: 'DNI', email: 'ops@acme.es',
      country: 'ES', plan: 'enterprise', createdAt: '2026-11-12T10:00:00.000Z', simulationCount: 0,
    });
    expect(t.repository.findById(1)).toEqual(res.body);
  });

  it('guardar los mismos datos es un guardado normal y no es duplicado de sí mismo', async () => {
    expect((await put(1, CONTRACT_REQUEST)).status).toBe(200);
    const again = await put(1, { ...CONTRACT_REQUEST, taxId: 'B 1234567-4' });
    expect(again.status).toBe(200);
    expect((again.body as { taxId: string }).taxId).toBe('B12345674');
  });
});

describe('validación igual que el alta', () => {
  it('campos ajenos → 400 con UNKNOWN_FIELD como primer error', async () => {
    const res = await put(1, { ...BODY, id: 5, createdAt: 'x', simulationCount: 3, email: 'mal' });
    expect(res.status).toBe(400);
    const fields = (res.body as { error: { details: { fields: { code: string }[] } } }).error.details.fields;
    expect(fields[0]?.code).toBe('UNKNOWN_FIELD');
  });

  it.each([
    ['DNI con control erróneo', { country: 'ES', taxId: '12345678A' }, 'TAX_ID_INVALID_CHECKSUM'],
    ['NIE válido pasa abajo', { country: 'ES', taxId: 'X1234567A' }, 'TAX_ID_INVALID_CHECKSUM'],
    ['CIF con control erróneo', { country: 'ES', taxId: 'A58818502' }, 'TAX_ID_INVALID_CHECKSUM'],
    ['UK no es un país ISO', { country: 'UK', taxId: '12345678Z' }, 'INVALID_COUNTRY'],
  ])('%s → 400 %s', async (_name, patch, expected) => {
    const res = await put(1, { ...BODY, ...patch });
    expect(res.status).toBe(400);
    const fields = (res.body as { error: { details: { fields: { code: string }[] } } }).error.details.fields;
    expect(fields.map((f) => f.code)).toContain(expected);
    expect(t.repository.findById(1)?.taxId).toBe('B12345674');
  });

  it.each([
    ['NIE X1234567L', { taxId: 'X1234567L' }],
    ['CIF A58818501', { taxId: 'A58818501' }],
    ['DNI 12345678Z', { taxId: '12345678Z' }],
  ])('%s válido → 200', async (_name, patch) => {
    expect((await put(1, { ...BODY, ...patch })).status).toBe(200);
  });

  it('ES → PT con un DNI → 400', async () => {
    expect((await put(1, { ...BODY, country: 'PT', taxId: '12345678Z' })).status).toBe(400);
  });

  it('cuerpo vacío o JSON malformado → 400 legible', async () => {
    expect(code(await put(1, '{}', true))).toBe('VALIDATION_ERROR');
    expect(code(await put(1, '{no', true))).toBe('MALFORMED_JSON');
    expect(code(await request(t.app).put('/customers/1').send('x'))).toBe('UNSUPPORTED_CONTENT_TYPE');
  });
});

describe('id, 404 y 409', () => {
  it.each(['0', '-1', 'abc', '007'])('id %s → 400 VALIDATION_ERROR con INVALID_ID', async (id) => {
    const res = await put(id, BODY);
    expect(res.status).toBe(400);
    const fields = (res.body as { error: { details: { fields: { code: string }[] } } }).error.details.fields;
    expect(fields[0]?.code).toBe('INVALID_ID');
  });

  it('inexistente → 404 CUSTOMER_NOT_FOUND', async () => {
    const res = await put(99, BODY);
    expect(res.status).toBe(404);
    expect(code(res)).toBe('CUSTOMER_NOT_FOUND');
  });

  it('país y NIF de otro cliente → 409 con su existingId y sin cambios', async () => {
    await post({ ...CONTRACT_REQUEST, companyName: 'Otra SL', taxId: '12345678Z' });
    const res = await put(1, { ...BODY, taxId: '12345678Z' });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: 'CUSTOMER_ALREADY_EXISTS', details: { existingId: 2 } } });
    expect(t.repository.findById(1)?.taxId).toBe('B12345674');
  });

  it('dos PUT al mismo (país, NIF) desde clientes distintos → un 200 y un 409, nunca 500', async () => {
    await post({ ...CONTRACT_REQUEST, companyName: 'Otra SL', taxId: '12345678Z' });
    await post({ ...CONTRACT_REQUEST, companyName: 'Tercera SL', taxId: '87654321X' });
    const target = { ...BODY, taxId: 'A58818501' };
    const [a, b] = await Promise.all([put(2, target), put(3, target)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });
});

describe('cambio de país con simulaciones', () => {
  it('permitido y las simulaciones existentes quedan intactas', async () => {
    const s = createSimulationsTestApp();
    const before = s.db.prepare('SELECT * FROM simulations').all();
    const sim = await request(s.app).post('/simulations').set('Content-Type', 'application/json')
      .send(JSON.stringify({ customerId: 7, users: 15, storage: 0, apiCalls: 0, currency: 'EUR' }));
    expect(sim.status).toBe(201);
    const stored = s.db.prepare('SELECT * FROM simulations').all();
    expect(before).toHaveLength(0);
    const res = await request(s.app).put('/customers/7').set('Content-Type', 'application/json')
      .send(JSON.stringify({ companyName: 'Cliente 7', country: 'US', taxId: '123456789', email: 'a@example.com', plan: 'starter' }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ country: 'US', simulationCount: 1 });
    expect(s.db.prepare('SELECT * FROM simulations').all()).toEqual(stored);
    s.close();
  });
});
