import { describe, expect, it } from 'vitest';
import { COUNTRY_MESSAGES } from '../countries/validate-country';
import { calculateQuote } from './calculate-quote';
import { INPUT_MESSAGES } from './pricing-input';
import { USERS_MESSAGES } from './validate-users';

const USERS_REQUIRED = { field: 'users', code: 'REQUIRED', message: USERS_MESSAGES.REQUIRED };
const USERS_NEGATIVE = { field: 'users', code: 'INVALID_USERS', reason: 'NEGATIVE', message: USERS_MESSAGES.NEGATIVE };
const COUNTRY_REQUIRED = { field: 'country', code: 'REQUIRED', message: COUNTRY_MESSAGES.REQUIRED };
const COUNTRY_INVALID = { field: 'country', code: 'INVALID_COUNTRY', message: COUNTRY_MESSAGES.INVALID_COUNTRY };
const INPUT_ERROR = { ok: false, errors: [{ field: 'input', code: 'INVALID_TYPE', message: INPUT_MESSAGES.INVALID_TYPE }] };

describe('calculateQuote · país no válido (RF9)', () => {
  it.each([null, undefined, ''])('%j → REQUIRED', (country) => {
    expect(calculateQuote({ users: 15, country })).toEqual({ ok: false, errors: [COUNTRY_REQUIRED] });
  });

  it.each([34, true, {}, ['ES']])('%j → INVALID_TYPE', (country) => {
    expect(calculateQuote({ users: 15, country })).toEqual({
      ok: false,
      errors: [{ field: 'country', code: 'INVALID_TYPE', message: COUNTRY_MESSAGES.INVALID_TYPE }],
    });
  });

  it.each(['es', 'Es', ' ES ', '   ', 'XX', 'EU', 'EL', 'XK', 'ESP', 'E'])('%j → INVALID_COUNTRY', (country) => {
    expect(calculateQuote({ users: 15, country })).toEqual({ ok: false, errors: [COUNTRY_INVALID] });
  });

  it('UK → INVALID_COUNTRY con suggestion GB', () => {
    expect(calculateQuote({ users: 15, country: 'UK' })).toEqual({
      ok: false,
      errors: [{ field: 'country', code: 'INVALID_COUNTRY', suggestion: 'GB', message: '¿Querías decir GB?' }],
    });
  });
});

describe('calculateQuote · combinaciones y orden (RF13)', () => {
  it('users -1 y country XX → dos errores en orden users, country', () => {
    expect(calculateQuote({ users: -1, country: 'XX' })).toEqual({ ok: false, errors: [USERS_NEGATIVE, COUNTRY_INVALID] });
  });

  it('users ausente y country null → REQUIRED, REQUIRED', () => {
    expect(calculateQuote({ country: null })).toEqual({ ok: false, errors: [USERS_REQUIRED, COUNTRY_REQUIRED] });
  });

  it('users -1 y country ES → un solo error', () => {
    expect(calculateQuote({ users: -1, country: 'ES' })).toEqual({ ok: false, errors: [USERS_NEGATIVE] });
  });

  it('{} → REQUIRED en users y en country', () => {
    expect(calculateQuote({})).toEqual({ ok: false, errors: [USERS_REQUIRED, COUNTRY_REQUIRED] });
  });

  it('un country heredado del prototipo se trata como ausente', () => {
    const input: unknown = Object.assign(Object.create({ country: 'ES' }), { users: 15 });
    expect(calculateQuote(input)).toEqual({ ok: false, errors: [COUNTRY_REQUIRED] });
  });
});

describe('calculateQuote · entrada que no es un objeto (RF16)', () => {
  it('sin argumento → INVALID_TYPE en input', () => {
    expect(calculateQuote()).toEqual(INPUT_ERROR);
  });

  it.each([null, undefined, [], [15, 'ES'], 15, '15', true])('%j → INVALID_TYPE en input', (input) => {
    expect(() => calculateQuote(input)).not.toThrow();
    expect(calculateQuote(input)).toEqual(INPUT_ERROR);
  });
});
