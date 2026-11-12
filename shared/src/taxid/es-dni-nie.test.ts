// Tests de DNI y NIE (RF11, RF12, RF18). Filas de la tabla "Identificador fiscal con país ES".
import { describe, expect, it } from 'vitest';
import { validateDniNie } from './es-dni-nie';

describe('validateDniNie · DNI válidos', () => {
  it.each([
    ['12345678Z'], // 12345678 mod 23 = 14 → Z
    ['00000023T'], // 23 mod 23 = 0 → T
    ['00000022E'], // 22 mod 23 = 22 → E, última letra del alfabeto
    ['01234567L'], // 1234567 mod 23 = 19 → L
  ])('%s → DNI', (id) => {
    expect(validateDniNie(id)).toEqual({ ok: true, value: id, taxIdType: 'DNI' });
  });
});

describe('validateDniNie · NIE válidos', () => {
  it.each([
    ['X1234567L'], // 01234567 mod 23 = 19 → L
    ['Y1234567X'], // 11234567 mod 23 = 10 → X
    ['Z1234567R'], // 21234567 mod 23 = 1 → R
  ])('%s → NIE', (id) => {
    expect(validateDniNie(id)).toEqual({ ok: true, value: id, taxIdType: 'NIE' });
  });
});

describe('validateDniNie · control incorrecto', () => {
  it.each([
    ['12345678A', 'DNI'],
    ['X1234567A', 'NIE'],
  ] as const)('%s → CHECKSUM con %s', (id, taxIdType) => {
    const r = validateDniNie(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe(taxIdType);
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validateDniNie · solo ceros (RF18)', () => {
  it.each([
    ['00000000T', 'DNI'],
    ['X0000000T', 'NIE'], // el control T sería correcto
    ['Y0000000Z', 'NIE'], // 10000000 mod 23 = 14 → Z, pero los 7 dígitos son ceros
  ] as const)('%s → FORMAT ALL_ZEROS con %s', (id, taxIdType) => {
    const r = validateDniNie(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe(taxIdType);
  });
});

describe('validateDniNie · formato inválido', () => {
  it.each([
    ['1234567L'], // 7 dígitos: sin relleno
    ['123456789Z'], // 9 dígitos
    ['12345678'], // sin letra
    ['12345678U'],
    ['12345678I'],
    ['12345678O'],
    ['12345678Ñ'],
    ['12345678ß'],
    ['12345678_Z'],
    ['12345678/Z'],
    ['X12345678L'], // NIE antiguo de 8 dígitos: sin conversión
    ['X123456L'], // NIE de 6 dígitos
    ['X1234567U'],
    ['W1234567D'], // no es DNI ni NIE
    [''],
  ])('%s → FORMAT sin reason ni taxIdType', (id) => {
    const r = validateDniNie(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error).not.toHaveProperty('reason');
    expect(r.error).not.toHaveProperty('taxIdType');
  });
});
