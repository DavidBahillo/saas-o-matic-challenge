// Errores inesperados y forma de las respuestas de error (T8): RF31 (500 genérico, sin
// detalles internos y sin filas a medias) y forma { error: { code, message, details? } } (CA6),
// comprobada con el helper común helpers/error-shape.ts.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTRACT_REQUEST, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { expectErrorShape } from './helpers/error-shape';
import type { CustomersRepository } from '../src/repositories/customers.repository';

const SECRET = 'SQLITE_IOERR: disk I/O error at /secret/path/saas.db';
const INTERNAL = { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } };

let t: TestApp | undefined;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t?.close();
  t = undefined;
  vi.restoreAllMocks();
});

function post(app: TestApp, body: unknown = CONTRACT_REQUEST): request.Test {
  return request(app.app).post('/customers').set('Content-Type', 'application/json').send(JSON.stringify(body));
}

function failingInsert(thrown: unknown): (real: CustomersRepository) => CustomersRepository {
  return (real) => ({
    ...real,
    insert: () => {
      throw thrown;
    },
  });
}

describe('RF31 · error inesperado → 500 INTERNAL_ERROR genérico', () => {
  it.each([
    ['un Error con detalles internos', new Error(SECRET)],
    ['un valor que no es Error', SECRET],
  ])('el repositorio lanza %s', async (_label, thrown) => {
    t = createTestApp({ wrapRepository: failingInsert(thrown) });
    const res = await post(t);
    expect(res.status).toBe(500);
    expect(res.body).toEqual(INTERNAL);
    expect(res.text).not.toContain('secret');
    expect(res.text).not.toContain('SQLITE');
    expect(t.countCustomers()).toBe(0);
  });

  it('el detalle solo va a console.error', async () => {
    t = createTestApp({ wrapRepository: failingInsert(new Error(SECRET)) });
    await post(t);
    expect(console.error).toHaveBeenCalled();
  });

  it('un fallo al buscar el existingId del 409 también da 500 genérico', async () => {
    t = createTestApp({
      wrapRepository: (real) => ({
        ...real,
        findByCountryAndTaxId: () => {
          throw new Error(SECRET);
        },
      }),
    });
    await post(t);
    const res = await post(t);
    expect(res.status).toBe(500);
    expect(res.body).toEqual(INTERNAL);
    expect(t.countCustomers()).toBe(1);
  });
});

describe('forma de las respuestas de error (CA6)', () => {
  it('todas las respuestas de error de POST /customers tienen la forma de la constitución', async () => {
    t = createTestApp();
    const app = t.app;
    const json = (body: string): request.Test =>
      request(app).post('/customers').set('Content-Type', 'application/json').send(body);
    await post(t);
    const responses = await Promise.all([
      post(t, { country: 'UK' }),
      post(t),
      request(app).post('/customers').set('Content-Type', 'text/plain').send('x'),
      json(' '.repeat(10_241)),
      json('{'),
      json('[]'),
      request(app).get('/foo'),
    ]);
    expect(responses.map((r) => r.status)).toEqual([400, 409, 400, 400, 400, 400, 404]);
    expect(responses.map(expectErrorShape)).toEqual([
      'VALIDATION_ERROR',
      'CUSTOMER_ALREADY_EXISTS',
      'UNSUPPORTED_CONTENT_TYPE',
      'PAYLOAD_TOO_LARGE',
      'MALFORMED_JSON',
      'VALIDATION_ERROR',
      'NOT_FOUND',
    ]);
  });
});
