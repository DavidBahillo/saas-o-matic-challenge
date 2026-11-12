// POST /simulations: validación (T8). Tabla "Alta: validación": RF5–RF11, errores de borde (RF9)
// y CA3 (ninguna fila 400/404 guarda nada).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSimulationsTestApp, fieldsOf, postRaw, postSimulation } from '../test/helpers/simulations-app';
import type { FieldError, SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;

beforeEach(() => {
  t = createSimulationsTestApp();
});

afterEach(() => {
  // CA3: ningún caso de este archivo deja simulaciones guardadas.
  expect(t.countSimulations()).toBe(0);
  t.close();
});

const OK = { customerId: 7, users: 15 };
const err = (field: string, code: string, reason?: string): FieldError =>
  reason === undefined ? { field, code } : { field, code, reason };

function expect400(res: request.Response, fields: FieldError[]): void {
  expect(res.status).toBe(400);
  expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  expect(fieldsOf(res)).toEqual(fields);
}

describe('RF5 · campos desconocidos', () => {
  it.each([
    [{ ...OK, totalCents: 1 }, ['totalCents']],
    [{ ...OK, country: 'FR' }, ['country']],
    [{ ...OK, plan: 'enterprise', tiers: [] }, ['plan', 'tiers']],
    [{ tiers: [], customerId: 7, zeta: 1, users: 15, alfa: 2 }, ['tiers', 'zeta', 'alfa']],
  ])('%j → UNKNOWN_FIELD en el orden del cuerpo', async (body, fields) => {
    expect400(
      await postSimulation(t, body),
      fields.map((f) => err(f, 'UNKNOWN_FIELD')),
    );
  });
});

describe('RF6 · customerId', () => {
  it.each([[{ users: 15 }], [{ customerId: null, users: 15 }]])('%j → REQUIRED', async (body) => {
    expect400(await postSimulation(t, body), [err('customerId', 'REQUIRED')]);
  });

  it('"7" → INVALID_TYPE', async () => {
    expect400(await postSimulation(t, { customerId: '7', users: 15 }), [err('customerId', 'INVALID_TYPE')]);
  });

  it.each(['0', '-1', '1.5', '9007199254740992', '-0'])('%s → INVALID_ID', async (raw) => {
    const res = await postRaw(t, `{"customerId": ${raw}, "users": 15}`);
    expect400(res, [err('customerId', 'INVALID_ID')]);
  });
});

describe('RF7 · users', () => {
  it.each([[{ customerId: 7 }], [{ customerId: 7, users: null }]])('%j → REQUIRED', async (body) => {
    expect400(await postSimulation(t, body), [err('users', 'REQUIRED')]);
  });

  it.each([['15'], [''], [true], [[15]]])('%j → INVALID_TYPE', async (users) => {
    expect400(await postSimulation(t, { customerId: 7, users }), [err('users', 'INVALID_TYPE')]);
  });

  it.each([
    [-1, 'NEGATIVE'],
    [1.5, 'NOT_INTEGER'],
    [100001, 'TOO_LARGE'],
    [-1.5, 'NOT_INTEGER'],
  ])('%s → INVALID_USERS %s', async (users, reason) => {
    expect400(await postSimulation(t, { customerId: 7, users }), [err('users', 'INVALID_USERS', reason)]);
  });

  it('clave duplicada: gana la última (-1 → NEGATIVE)', async () => {
    const res = await postRaw(t, '{"customerId": 7, "users": 15, "users": -1}');
    expect400(res, [err('users', 'INVALID_USERS', 'NEGATIVE')]);
  });
});

describe('RF8 · storage y apiCalls', () => {
  describe.each(['storage', 'apiCalls'])('%s', (field) => {
    it.each([
      [-1, 'NEGATIVE'],
      [1000001, 'TOO_LARGE'],
      [2.5, 'NOT_INTEGER'],
      [-2.5, 'NOT_INTEGER'],
    ])('%s → INVALID_RESOURCE %s', async (value, reason) => {
      const res = await postSimulation(t, { ...OK, [field]: value });
      expect400(res, [err(field, 'INVALID_RESOURCE', reason)]);
    });

    it.each([[null], ['50']])('%j → INVALID_TYPE', async (value) => {
      expect400(await postSimulation(t, { ...OK, [field]: value }), [err(field, 'INVALID_TYPE')]);
    });
  });
});

describe('Orden de errores y RF10/RF11', () => {
  it('cuatro errores en orden: customerId, users, storage y foo', async () => {
    const res = await postSimulation(t, {
      foo: 1,
      customerId: 'x',
      users: -1,
      storage: -1,
    });
    expect400(res, [
      err('customerId', 'INVALID_TYPE'),
      err('users', 'INVALID_USERS', 'NEGATIVE'),
      err('storage', 'INVALID_RESOURCE', 'NEGATIVE'),
      err('foo', 'UNKNOWN_FIELD'),
    ]);
  });

  it('cliente 999 → 404 CUSTOMER_NOT_FOUND', async () => {
    const res = await postSimulation(t, { customerId: 999, users: 15 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'CUSTOMER_NOT_FOUND',
        message: 'No existe el cliente 999.',
      },
    });
  });

  it('cliente 999 con users -1 → 400 (se valida antes)', async () => {
    const res = await postSimulation(t, { customerId: 999, users: -1 });
    expect400(res, [err('users', 'INVALID_USERS', 'NEGATIVE')]);
  });
});

describe('RF9 · errores de borde', () => {
  it.each(['[]', '"x"', 'null'])('cuerpo %s → INVALID_TYPE en body', async (raw) => {
    expect400(await postRaw(t, raw), [err('body', 'INVALID_TYPE')]);
  });

  it('JSON mal formado → MALFORMED_JSON', async () => {
    const res = await postRaw(t, '{"customerId": 7,');
    expect(res.status).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('MALFORMED_JSON');
  });

  it('sin application/json → UNSUPPORTED_CONTENT_TYPE', async () => {
    const res = await request(t.app).post('/simulations').set('Content-Type', 'text/plain').send(JSON.stringify(OK));
    expect(res.status).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
  });

  it('más de 10 240 bytes → PAYLOAD_TOO_LARGE', async () => {
    const raw = JSON.stringify({ ...OK, pad: 'a'.repeat(10240) });
    const res = await postRaw(t, raw);
    expect(res.status).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
