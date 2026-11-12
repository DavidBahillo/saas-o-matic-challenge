// Transporte de POST /customers (T8): RF26 Content-Type, RF27 tamaño, RF28 JSON mal formado,
// RF29 cuerpo que no es objeto, RF30 404 antes que el transporte. CA5: ningún rechazo deja filas.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_REQUEST, VALIDATION_MESSAGE, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { rawPostCustomers } from './helpers/raw-http';

const LIMIT = 10_240;
const JSON_TYPE = 'application/json';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

function postRaw(body: string, contentType = JSON_TYPE): request.Test {
  return request(t.app).post('/customers').set('Content-Type', contentType).send(body);
}

/** Cuerpo válido rellenado con espacios hasta `bytes` bytes exactos (UTF-8). */
function paddedValidBody(bytes: number): string {
  const json = JSON.stringify(CONTRACT_REQUEST);
  const body = `{${' '.repeat(bytes - Buffer.byteLength(json))}${json.slice(1)}`;
  expect(Buffer.byteLength(body)).toBe(bytes);
  return body;
}

function expectError(res: request.Response, status: number, code: string): void {
  expect(res.status).toBe(status);
  expect(res.body).toMatchObject({ error: { code } });
  expect(t.countCustomers()).toBe(0);
}

describe('RF26 · Content-Type', () => {
  it.each(['text/plain', 'application/x-www-form-urlencoded', 'application/json; charset=latin1'])(
    '%s → 400 UNSUPPORTED_CONTENT_TYPE',
    async (type) => {
      expectError(await postRaw(JSON.stringify(CONTRACT_REQUEST), type), 400, 'UNSUPPORTED_CONTENT_TYPE');
    },
  );

  it('sin Content-Type ni cuerpo → 400 UNSUPPORTED_CONTENT_TYPE', async () => {
    const res = await rawPostCustomers(t.app, ['Content-Length: 0']);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'UNSUPPORTED_CONTENT_TYPE' } });
  });

  it('sin Content-Type con un cuerpo JSON válido → 400 UNSUPPORTED_CONTENT_TYPE', async () => {
    const body = JSON.stringify(CONTRACT_REQUEST);
    const length = `Content-Length: ${String(Buffer.byteLength(body))}`;
    const res = await rawPostCustomers(t.app, [length], body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'UNSUPPORTED_CONTENT_TYPE' } });
    expect(t.countCustomers()).toBe(0);
  });

  it('el Content-Type se comprueba antes que el tamaño', async () => {
    expectError(await postRaw('x'.repeat(LIMIT + 1), 'text/plain'), 400, 'UNSUPPORTED_CONTENT_TYPE');
  });

  it.each(['application/json; charset=utf-8', 'Application/JSON'])('%s → se procesa (201)', async (type) => {
    const res = await postRaw(JSON.stringify(CONTRACT_REQUEST), type);
    expect(res.status).toBe(201);
  });
});

describe('RF27 · tamaño máximo de 10 240 bytes', () => {
  it('10 240 bytes exactos → se procesa (201)', async () => {
    const res = await postRaw(paddedValidBody(LIMIT));
    expect(res.status).toBe(201);
    expect(t.countCustomers()).toBe(1);
  });

  it('10 241 bytes → 400 PAYLOAD_TOO_LARGE sin procesarlo', async () => {
    expectError(await postRaw(paddedValidBody(LIMIT + 1)), 400, 'PAYLOAD_TOO_LARGE');
  });

  it('el tamaño se comprueba antes que la sintaxis', async () => {
    expectError(await postRaw('{'.repeat(LIMIT + 1)), 400, 'PAYLOAD_TOO_LARGE');
  });
});

describe('RF28 · MALFORMED_JSON', () => {
  it.each(['{', '', '   ', '{"a":1,}', "{'a':1}", 'undefined'])('cuerpo %j → 400 MALFORMED_JSON', async (body) => {
    expectError(await postRaw(body), 400, 'MALFORMED_JSON');
  });

  it('Content-Type JSON con Content-Length: 0 (req.body === "") → 400 MALFORMED_JSON', async () => {
    const res = await rawPostCustomers(t.app, [`Content-Type: ${JSON_TYPE}`, 'Content-Length: 0']);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'MALFORMED_JSON' } });
  });

  it('supertest sin .send() con Content-Type JSON → 400 MALFORMED_JSON', async () => {
    expectError(await request(t.app).post('/customers').set('Content-Type', JSON_TYPE), 400, 'MALFORMED_JSON');
  });

  it('sin Content-Length ni Transfer-Encoding (req.body === undefined) → 400 MALFORMED_JSON', async () => {
    const res = await rawPostCustomers(t.app, [`Content-Type: ${JSON_TYPE}`]);
    expect(res).toEqual({
      status: 400,
      body: { error: { code: 'MALFORMED_JSON', message: 'El cuerpo de la petición no es un JSON válido.' } },
    });
    expect(t.countCustomers()).toBe(0);
  });

  it('el mensaje es genérico y no expone el error del parser', async () => {
    const res = await postRaw('{');
    expect(res.body).toEqual({
      error: { code: 'MALFORMED_JSON', message: 'El cuerpo de la petición no es un JSON válido.' },
    });
  });
});

describe('RF29 · cuerpo JSON que no es objeto', () => {
  it.each(['[]', '"texto"', '42', 'null', 'true', '[{"companyName":"Acme"}]'])(
    'cuerpo %s → 400 VALIDATION_ERROR con INVALID_TYPE en body',
    async (body) => {
      const res = await postRaw(body);
      expectError(res, 400, 'VALIDATION_ERROR');
      expect(res.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: VALIDATION_MESSAGE,
          details: {
            fields: [{ field: 'body', code: 'INVALID_TYPE', message: 'El cuerpo debe ser un objeto JSON.' }],
          },
        },
      });
    },
  );
});

describe('RF30 · ruta o método inexistente → 404 NOT_FOUND antes que el transporte', () => {
  const NOT_FOUND = { error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } };

  it.each([
    ['get', '/foo'],
    ['delete', '/customers/1'],
    ['put', '/customers'],
    ['patch', '/customers'],
    ['post', '/customers/1'],
  ] as const)('%s %s → 404', async (method, path) => {
    const res = await request(t.app)[method](path);
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
  });

  it.each(['/customers', '/customers/1'])('OPTIONS %s → 404 NOT_FOUND (método no definido, T11)', async (path) => {
    const res = await request(t.app).options(path);
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
    expect(res.headers).not.toHaveProperty('allow');
  });

  it('POST /foo con text/plain → 404, no UNSUPPORTED_CONTENT_TYPE', async () => {
    const res = await request(t.app).post('/foo').set('Content-Type', 'text/plain').send('hola');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND);
  });

  it('POST /foo con más de 10 240 bytes o JSON mal formado → 404', async () => {
    const big = await request(t.app).post('/foo').set('Content-Type', JSON_TYPE).send('{'.repeat(LIMIT + 1));
    const bad = await request(t.app).post('/foo').set('Content-Type', JSON_TYPE).send('{');
    expect([big.status, bad.status]).toEqual([404, 404]);
  });
});

describe('RF30/RF31 · errores 4xx del router y de la descompresión (T11, vuelta 2)', () => {
  it.each(['delete', 'put', 'post'] as const)('%s /customers/ZZ mal codificado (%%ZZ) → 404 NOT_FOUND sin filas', async (method) => {
    const res = await request(t.app)[method]('/customers/%ZZ');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } });
    expect(t.countCustomers()).toBe(0);
  });

  it('Content-Encoding gzip con un cuerpo que no es gzip → 400 MALFORMED_JSON sin filas', async () => {
    const res = await request(t.app)
      .post('/customers')
      .set('Content-Type', JSON_TYPE)
      .set('Content-Encoding', 'gzip')
      .send('{}');
    expectError(res, 400, 'MALFORMED_JSON');
  });
});
