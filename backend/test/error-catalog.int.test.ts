// Catálogo de todas las respuestas de error de la API (T10, CA6). Recorre cada código de la tabla
// "Códigos de error" y cada código de campo, y comprueba la forma { error: { code, message,
// details? } }, el estado (solo 400, 404, 409 y 500) y que ningún rechazo deja filas (CA5).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiErrorCode, FieldErrorCode } from '@saas-o-matic/shared';
import { CONTRACT_REQUEST, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { FIELD_CODES, STATUS_BY_CODE, expectErrorShape, fieldCodesOf } from './helpers/error-shape';

type Send = (t: TestApp) => request.Test;
type Case = readonly [label: string, send: Send, code: ApiErrorCode, fieldCode: FieldErrorCode | null];

const JSON_TYPE = 'application/json';
const json = (body: string): Send => (t) => request(t.app).post('/customers').set('Content-Type', JSON_TYPE).send(body);
const create = (patch: Record<string, unknown>): Send => json(JSON.stringify({ ...CONTRACT_REQUEST, ...patch }));
const get = (path: string): Send => (t) => request(t.app).get(path);

const CASES: readonly Case[] = [
  ['campo obligatorio vacío', create({ plan: '' }), 'VALIDATION_ERROR', 'REQUIRED'],
  ['tax ID como número', create({ taxId: 12345678 }), 'VALIDATION_ERROR', 'INVALID_TYPE'],
  ['campo desconocido', create({ discount: 10 }), 'VALIDATION_ERROR', 'UNKNOWN_FIELD'],
  ['nombre de 1 code point', create({ companyName: 'A' }), 'VALIDATION_ERROR', 'INVALID_LENGTH'],
  ['nombre con tabulador', create({ companyName: 'Acme\tIbérica' }), 'VALIDATION_ERROR', 'INVALID_CHARACTERS'],
  ['email sin dominio', create({ email: 'ventas@acme' }), 'VALIDATION_ERROR', 'INVALID_EMAIL'],
  ['país UK', create({ country: 'UK' }), 'VALIDATION_ERROR', 'INVALID_COUNTRY'],
  ['plan pro', create({ plan: 'pro' }), 'VALIDATION_ERROR', 'INVALID_PLAN'],
  ['prefijo de país', create({ taxId: 'ESB12345674' }), 'VALIDATION_ERROR', 'TAX_ID_INVALID_FORMAT'],
  ['solo ceros (con taxIdType)', create({ taxId: '00000000T' }), 'VALIDATION_ERROR', 'TAX_ID_INVALID_FORMAT'],
  ['control erróneo', create({ taxId: '12345678A' }), 'VALIDATION_ERROR', 'TAX_ID_INVALID_CHECKSUM'],
  ['cuerpo que no es objeto', json('[]'), 'VALIDATION_ERROR', 'INVALID_TYPE'],
  ['id no canónico', get('/customers/01'), 'VALIDATION_ERROR', 'INVALID_ID'],
  ['q repetido', get('/customers?q=a&q=b'), 'VALIDATION_ERROR', 'INVALID_TYPE'],
  ['q de 101 code points', get(`/customers?q=${'a'.repeat(101)}`), 'VALIDATION_ERROR', 'INVALID_LENGTH'],
  ['Content-Type text/plain', (t) => request(t.app).post('/customers').set('Content-Type', 'text/plain').send('x'), 'UNSUPPORTED_CONTENT_TYPE', null],
  ['cuerpo de 10 241 bytes', json(' '.repeat(10_241)), 'PAYLOAD_TOO_LARGE', null],
  ['JSON mal formado', json('{'), 'MALFORMED_JSON', null],
  ['cuerpo vacío', json(''), 'MALFORMED_JSON', null],
  ['cliente inexistente', get('/customers/99'), 'CUSTOMER_NOT_FOUND', null],
  ['simulación inexistente', get('/simulations/999'), 'SIMULATION_NOT_FOUND', null],
  ['ruta inexistente', get('/foo'), 'NOT_FOUND', null],
  ['método inexistente', (t) => request(t.app).delete('/customers/1'), 'NOT_FOUND', null],
  ['alta duplicada', create({}), 'CUSTOMER_ALREADY_EXISTS', null],
];

let t: TestApp;

beforeEach(async () => {
  t = createTestApp();
  await create({})(t).expect(201);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

describe('CA6 · forma de todas las respuestas de error', () => {
  it.each(CASES)('%s → %s', async (_label, send, code, fieldCode) => {
    const res = await send(t);
    expect(expectErrorShape(res)).toBe(code);
    if (fieldCode !== null) expect(fieldCodesOf(res)).toContain(fieldCode);
    expect(t.countCustomers()).toBe(1);
  });

  it('500 INTERNAL_ERROR con un repositorio que lanza', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = createTestApp({
      wrapRepository: (real) => ({
        ...real,
        insert: () => {
          throw new Error('boom');
        },
      }),
    });
    try {
      expect(expectErrorShape(await create({})(failing))).toBe('INTERNAL_ERROR');
      expect(failing.countCustomers()).toBe(0);
    } finally {
      failing.close();
    }
  });

  it('el catálogo recorre todos los códigos de la tabla y todos los códigos de campo', () => {
    const covered = new Set([...CASES.map(([, , code]) => code), 'INTERNAL_ERROR']);
    expect([...covered].sort()).toEqual(Object.keys(STATUS_BY_CODE).sort());
    expect(new Set(CASES.flatMap(([, , , fieldCode]) => (fieldCode === null ? [] : [fieldCode])))).toEqual(new Set(FIELD_CODES));
    expect(new Set(Object.values(STATUS_BY_CODE))).toEqual(new Set([400, 404, 409, 500]));
  });
});
