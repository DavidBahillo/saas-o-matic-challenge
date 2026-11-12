// POST /customers de extremo a extremo (T8): RF1 (201 del contrato), RF2 (normalización),
// RF3 (varios errores a la vez), RF8, RF21 (409 con existingId) y CA5 (sin filas en rechazos).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COUNTRY_MESSAGES, EMAIL_MESSAGES } from '@saas-o-matic/shared';
import {
  CONTRACT_REQUEST,
  CONTRACT_RESPONSE,
  VALIDATION_MESSAGE,
  createTestApp,
} from './helpers/test-app';
import type { TestApp } from './helpers/test-app';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

function post(body: unknown): request.Test {
  return request(t.app).post('/customers').set('Content-Type', 'application/json').send(JSON.stringify(body));
}

describe('RF1 · alta válida', () => {
  it('responde 201 con el ejemplo exacto del contrato', async () => {
    const res = await post(CONTRACT_REQUEST);
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.body).toEqual(CONTRACT_RESPONSE);
  });

  it('guarda el cliente ya normalizado (RF2)', async () => {
    await post(CONTRACT_REQUEST);
    expect(t.countCustomers()).toBe(1);
    expect(t.repository.findById(1)).toEqual(CONTRACT_RESPONSE);
  });

  it('asigna ids consecutivos', async () => {
    await post(CONTRACT_REQUEST);
    const res = await post({ ...CONTRACT_REQUEST, taxId: '12345678Z' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 2, taxId: '12345678Z', taxIdType: 'DNI' });
  });

  it('el mismo tax ID en otro país es otro cliente (980780684 en GB y en US)', async () => {
    const gb = await post({ ...CONTRACT_REQUEST, country: 'GB', taxId: '980780684' });
    const us = await post({ ...CONTRACT_REQUEST, country: 'US', taxId: '980780684' });
    expect([gb.status, us.status]).toEqual([201, 201]);
    expect([gb.body, us.body]).toMatchObject([{ taxIdType: 'GB_VAT' }, { taxIdType: 'OTHER' }]);
  });
});

describe('RF3 · 400 VALIDATION_ERROR con todos los campos erróneos', () => {
  it('ejemplo del contrato: prefijo GB y email no válido', async () => {
    const res = await post({ ...CONTRACT_REQUEST, country: 'GB', taxId: 'GB980780684', email: 'ventas@acme' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: VALIDATION_MESSAGE,
        details: {
          fields: [
            { field: 'taxId', code: 'TAX_ID_INVALID_FORMAT', reason: 'COUNTRY_PREFIX', message: 'Introduce el identificador fiscal sin el prefijo GB.' },
            { field: 'email', code: 'INVALID_EMAIL', message: EMAIL_MESSAGES.INVALID_EMAIL },
          ],
        },
      },
    });
    expect(t.countCustomers()).toBe(0);
  });

  it('ejemplo del contrato: país UK con sugerencia GB', async () => {
    const res = await post({ ...CONTRACT_REQUEST, country: 'UK' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: VALIDATION_MESSAGE,
        details: {
          fields: [
            { field: 'country', code: 'INVALID_COUNTRY', suggestion: 'GB', message: COUNTRY_MESSAGES.UK_SUGGESTION },
          ],
        },
      },
    });
  });

  it('objeto vacío → REQUIRED en los cinco campos', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    const fields = (res.body as { error: { details: { fields: { field: string; code: string }[] } } }).error.details
      .fields;
    expect(fields.map((f) => [f.field, f.code])).toEqual([
      ['companyName', 'REQUIRED'],
      ['taxId', 'REQUIRED'],
      ['email', 'REQUIRED'],
      ['country', 'REQUIRED'],
      ['plan', 'REQUIRED'],
    ]);
  });

  it('null, tipo erróneo y campo desconocido en la misma petición', async () => {
    const res = await post({ ...CONTRACT_REQUEST, companyName: null, taxId: 12345678, discount: 10 });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          fields: [
            { field: 'companyName', code: 'REQUIRED' },
            { field: 'taxId', code: 'INVALID_TYPE' },
            { field: 'discount', code: 'UNKNOWN_FIELD' },
          ],
        },
      },
    });
    expect(t.countCustomers()).toBe(0);
  });

  it('__proto__ como clave del JSON → UNKNOWN_FIELD, no se pierde por el camino', async () => {
    const raw = `{"__proto__": {"x": 1}, ${JSON.stringify(CONTRACT_REQUEST).slice(1)}`;
    const res = await request(t.app).post('/customers').set('Content-Type', 'application/json').send(raw);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { details: { fields: [{ field: '__proto__', code: 'UNKNOWN_FIELD' }] } },
    });
    expect(t.countCustomers()).toBe(0);
  });
});

describe('RF8 · país inválido y tax ID', () => {
  it('XX + 12345678A → un único error INVALID_COUNTRY', async () => {
    const res = await post({ ...CONTRACT_REQUEST, country: 'XX', taxId: '12345678A' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { details: { fields: [{ field: 'country', code: 'INVALID_COUNTRY' }] } },
    });
    expect((res.body as { error: { details: { fields: unknown[] } } }).error.details.fields).toHaveLength(1);
  });
});

describe('RF21 · 409 CUSTOMER_ALREADY_EXISTS', () => {
  it('el segundo alta igual responde 409 con existingId y no crea fila', async () => {
    await post(CONTRACT_REQUEST);
    const res = await post({ ...CONTRACT_REQUEST, companyName: 'Otra Empresa SL' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: {
        code: 'CUSTOMER_ALREADY_EXISTS',
        message: 'Ya existe un cliente con ese identificador fiscal en ES.',
        details: { existingId: 1 },
      },
    });
    expect(t.countCustomers()).toBe(1);
  });

  it('12345678-z tras 12345678Z también es duplicado (identificador normalizado)', async () => {
    await post({ ...CONTRACT_REQUEST, taxId: '12345678Z' });
    const res = await post({ ...CONTRACT_REQUEST, taxId: '12345678-z', country: ' es ' });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { details: { existingId: 1 } } });
    expect(t.countCustomers()).toBe(1);
  });
});
