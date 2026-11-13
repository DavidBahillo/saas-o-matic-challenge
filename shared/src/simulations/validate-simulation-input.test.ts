import { describe, expect, it } from 'vitest';
import { UNKNOWN_FIELD_MESSAGE } from '../customers/validate-customer-input';
import { USERS_MESSAGES } from '../pricing/validate-users';
import { validateSimulationInput } from './validate-simulation-input';

const fieldsOf = (raw: Record<string, unknown>) => {
  const r = validateSimulationInput(raw);
  return r.ok ? [] : r.errors.map((e) => [e.field, e.code]);
};

describe('validateSimulationInput (RF4–RF8)', () => {
  it('cuerpo válido sin recursos da storage 0 y apiCalls 0', () => {
    expect(validateSimulationInput({ customerId: 7, users: 15 })).toEqual({
      ok: true,
      value: { customerId: 7, users: 15, storage: 0, apiCalls: 0, currency: 'EUR' },
    });
  });

  it('normaliza -0 en users y recursos', () => {
    const r = validateSimulationInput({ customerId: 7, users: -0, storage: -0, apiCalls: -0 });
    expect(r.ok).toBe(true);
    if (r.ok) for (const v of [r.value.users, r.value.storage, r.value.apiCalls]) expect(Object.is(v, 0)).toBe(true);
  });

  it('orden fijo: customerId, users, storage y desconocidos', () => {
    expect(fieldsOf({ foo: 1, storage: -1, users: -1, customerId: 'x' })).toEqual([
      ['customerId', 'INVALID_TYPE'],
      ['users', 'INVALID_USERS'],
      ['storage', 'INVALID_RESOURCE'],
      ['foo', 'UNKNOWN_FIELD'],
    ]);
  });

  it('UNKNOWN_FIELD en el orden del cuerpo, con el mensaje de la 001', () => {
    const r = validateSimulationInput({ tiers: [], customerId: 7, zeta: 1, users: 15, alfa: 2 });
    expect(r).toEqual({
      ok: false,
      errors: ['tiers', 'zeta', 'alfa'].map((field) => ({ field, code: 'UNKNOWN_FIELD', message: UNKNOWN_FIELD_MESSAGE })),
    });
  });

  it('un __proto__ propio es UNKNOWN_FIELD', () => {
    const raw = JSON.parse('{"customerId":7,"users":15,"__proto__":{"x":1}}') as Record<string, unknown>;
    expect(fieldsOf(raw)).toEqual([['__proto__', 'UNKNOWN_FIELD']]);
  });

  it('las claves heredadas se tratan como ausentes', () => {
    const raw = Object.create({ customerId: 7, users: 15, storage: 5, foo: 1 }) as Record<string, unknown>;
    expect(fieldsOf(raw)).toEqual([['customerId', 'REQUIRED'], ['users', 'REQUIRED']]);
  });

  it.each([
    [undefined, 'REQUIRED', undefined],
    [null, 'REQUIRED', undefined],
    ['15', 'INVALID_TYPE', undefined],
    [1.5, 'INVALID_USERS', 'NOT_INTEGER'],
    [-1, 'INVALID_USERS', 'NEGATIVE'],
    [100_001, 'INVALID_USERS', 'TOO_LARGE'],
  ] as const)('users %j da %s (códigos de la 002)', (users, code, reason) => {
    const r = validateSimulationInput({ customerId: 7, users });
    const message = USERS_MESSAGES[reason ?? code];
    expect(r).toEqual({ ok: false, errors: [{ field: 'users', code, message, ...(reason ? { reason } : {}) }] });
  });

  it('apiCalls inválido aparece tras storage', () => {
    expect(fieldsOf({ apiCalls: '1', storage: 2.5, customerId: 7, users: 1 })).toEqual([
      ['storage', 'INVALID_RESOURCE'],
      ['apiCalls', 'INVALID_TYPE'],
    ]);
  });

  it('currency USD se conserva', () => {
    expect(validateSimulationInput({ customerId: 7, users: 1, currency: 'USD' })).toEqual({
      ok: true,
      value: { customerId: 7, users: 1, storage: 0, apiCalls: 0, currency: 'USD' },
    });
  });

  it('orden fijo con currency: customerId, users, currency y desconocidos', () => {
    expect(fieldsOf({ customerId: 'x', users: -1, currency: 'JPY', foo: 1 })).toEqual([
      ['customerId', 'INVALID_TYPE'],
      ['users', 'INVALID_USERS'],
      ['currency', 'CURRENCY_NOT_AVAILABLE'],
      ['foo', 'UNKNOWN_FIELD'],
    ]);
  });

  it('currency va después de storage y apiCalls', () => {
    expect(fieldsOf({ currency: 'JPY', apiCalls: -1, storage: -1, customerId: 7, users: 15 })).toEqual([
      ['storage', 'INVALID_RESOURCE'],
      ['apiCalls', 'INVALID_RESOURCE'],
      ['currency', 'CURRENCY_NOT_AVAILABLE'],
    ]);
  });

  it.each([['USD\n', 'INVALID_CURRENCY'], [null, 'INVALID_TYPE'], ['usd', 'INVALID_CURRENCY']])(
    'currency %j da %s',
    (currency, code) => {
      expect(fieldsOf({ customerId: 7, users: 15, currency })).toEqual([['currency', code]]);
    },
  );

  it('exchangeRate y los importes de salida son UNKNOWN_FIELD (RF3)', () => {
    const raw = { customerId: 7, users: 15, currency: 'USD', exchangeRate: '2', convertedTotalCents: 1 };
    expect(fieldsOf(raw)).toEqual([
      ['exchangeRate', 'UNKNOWN_FIELD'],
      ['convertedTotalCents', 'UNKNOWN_FIELD'],
    ]);
  });
});
