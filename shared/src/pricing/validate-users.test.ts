import { describe, expect, it } from 'vitest';
import { USERS_MESSAGES, validateUsers } from './validate-users';

type Reason = 'NOT_FINITE' | 'NOT_INTEGER' | 'NEGATIVE' | 'TOO_LARGE';

const DOMAIN_ROWS: ReadonlyArray<readonly [number, Reason]> = [
  [-1, 'NEGATIVE'],
  [1.5, 'NOT_INTEGER'],
  [10.01, 'NOT_INTEGER'],
  [-1.5, 'NOT_INTEGER'], // va antes que NEGATIVE
  [100000.5, 'NOT_INTEGER'], // va antes que TOO_LARGE
  [100001, 'TOO_LARGE'],
  [1e9, 'TOO_LARGE'],
  [NaN, 'NOT_FINITE'],
  [Infinity, 'NOT_FINITE'],
  [-Infinity, 'NOT_FINITE'],
];

describe('validateUsers', () => {
  it.each(DOMAIN_ROWS)('%s → INVALID_USERS / %s', (raw, reason) => {
    expect(validateUsers(raw)).toEqual({
      ok: false,
      error: { field: 'users', code: 'INVALID_USERS', reason, message: USERS_MESSAGES[reason] },
    });
  });

  it.each([null, undefined])('%s → REQUIRED', (raw) => {
    expect(validateUsers(raw)).toEqual({
      ok: false,
      error: { field: 'users', code: 'REQUIRED', message: 'El número de usuarios es obligatorio.' },
    });
  });

  it.each(['15', '', true, {}, [], [15]])('%j → INVALID_TYPE', (raw) => {
    expect(validateUsers(raw)).toEqual({
      ok: false,
      error: {
        field: 'users',
        code: 'INVALID_TYPE',
        message: 'El número de usuarios debe ser un número.',
      },
    });
  });

  it('fija los mensajes exactos', () => {
    expect(USERS_MESSAGES).toEqual({
      REQUIRED: 'El número de usuarios es obligatorio.',
      INVALID_TYPE: 'El número de usuarios debe ser un número.',
      NOT_FINITE: 'El número de usuarios debe ser un número finito.',
      NOT_INTEGER: 'El número de usuarios debe ser un número entero.',
      NEGATIVE: 'El número de usuarios no puede ser negativo.',
      TOO_LARGE: 'El número de usuarios no puede ser mayor que 100 000.',
    });
  });

  it.each([0, 1, 1e1, 100000])('%s es válido', (raw) => {
    expect(validateUsers(raw)).toEqual({ ok: true, value: raw });
  });

  it('-0 se convierte en +0', () => {
    const result = validateUsers(-0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.is(result.value, -0)).toBe(false);
  });
});
