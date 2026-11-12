// GET /customers/:id (T9, RF22): 200 con la forma del alta, 400 INVALID_ID para cualquier id que
// no sea un entero decimal canónico entre 1 y MAX_SAFE_INTEGER, y 404 CUSTOMER_NOT_FOUND.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_REQUEST, CONTRACT_RESPONSE, VALIDATION_MESSAGE, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

async function createContractCustomer(): Promise<void> {
  const res = await request(t.app)
    .post('/customers')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(CONTRACT_REQUEST));
  expect(res.status).toBe(201);
}

describe('RF22 · cliente existente', () => {
  it('GET /customers/1 → 200 con la misma forma que el 201 del alta', async () => {
    await createContractCustomer();
    const res = await request(t.app).get('/customers/1');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.body).toEqual(CONTRACT_RESPONSE);
  });

  it('ignora la query string', async () => {
    await createContractCustomer();
    const res = await request(t.app).get('/customers/1?foo=1&q[]=a');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(CONTRACT_RESPONSE);
  });
});

describe('RF22 · 404 CUSTOMER_NOT_FOUND', () => {
  it.each(['99', '9007199254740991'])('/%s inexistente → 404', async (id) => {
    await createContractCustomer();
    const res = await request(t.app).get(`/customers/${id}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'CUSTOMER_NOT_FOUND', message: `No existe el cliente ${id}.` },
    });
  });
});

describe('RF22 · 400 INVALID_ID', () => {
  it.each([
    'abc',
    '0',
    '-1',
    '01',
    '1.5',
    '1e3',
    '9007199254740992',
    '99999999999999999999999',
    '+1',
    '0x1',
    '%201',
    '1%20',
    '%EF%BC%91',
  ])('/%s → 400 VALIDATION_ERROR con INVALID_ID en id', async (path) => {
    const res = await request(t.app).get(`/customers/${path}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: VALIDATION_MESSAGE,
        details: {
          fields: [{ field: 'id', code: 'INVALID_ID', message: expect.any(String) as string }],
        },
      },
    });
  });

  it('el mensaje de INVALID_ID está en español', async () => {
    const res = await request(t.app).get('/customers/abc');
    const body = res.body as { error: { details: { fields: { message: string }[] } } };
    expect(body.error.details.fields[0]?.message).toBe(
      'El id debe ser un número entero entre 1 y 9007199254740991.',
    );
  });
});

describe('RF30 · rutas vecinas', () => {
  it('GET /customers/1/extra → 404 NOT_FOUND', async () => {
    const res = await request(t.app).get('/customers/1/extra');
    expect(res.status).toBe(404);
    expect((res.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });
});

describe('RF22 · id que no se puede decodificar (T11)', () => {
  it.each(['%ZZ', '%'])('/customers/%s → 400 VALIDATION_ERROR con INVALID_ID, no 500', async (path) => {
    const res = await request(t.app).get(`/customers/${path}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: VALIDATION_MESSAGE,
        details: {
          fields: [
            { field: 'id', code: 'INVALID_ID', message: 'El id debe ser un número entero entre 1 y 9007199254740991.' },
          ],
        },
      },
    });
  });
});

describe('RF30 · HEAD responde como el GET equivalente, sin cuerpo (T11)', () => {
  async function expectHeadLikeGet(path: string, status: number): Promise<void> {
    const get = await request(t.app).get(path);
    const head = await request(t.app).head(path);
    expect([get.status, head.status]).toEqual([status, status]);
    expect(head.headers['content-type']).toBe(get.headers['content-type']);
    expect(head.headers['content-length']).toBe(get.headers['content-length']);
    expect(head.text).toBeFalsy();
    expect(head.body).toEqual({});
  }

  it.each([
    ['/customers?q=acme', 200],
    ['/customers/1', 200],
    ['/customers/99', 404],
  ])('HEAD %s → %i con las cabeceras del GET y sin cuerpo', async (path, status) => {
    await createContractCustomer();
    await expectHeadLikeGet(path, status);
  });
});
