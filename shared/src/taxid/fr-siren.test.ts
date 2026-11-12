// Tests del SIREN francés (RF10, RF11, RF14, RF18). Filas de la tabla "Identificador fiscal
// con país FR". Las filas del prefijo (`FR732829320`, `FR44732829320`) van en validate-tax-id (T5).
import { describe, expect, it } from 'vitest';
import { validateFrSiren } from './fr-siren';

describe('validateFrSiren · válidos', () => {
  it.each([
    ['732829320'], // suma Luhn 40; control 0
    ['552100554'], // suma Luhn 20
  ])('%s → FR_SIREN', (id) => {
    expect(validateFrSiren(id)).toEqual({ ok: true, value: id, taxIdType: 'FR_SIREN' });
  });
});

describe('validateFrSiren · control incorrecto', () => {
  it.each([['732829321'], ['552100555']])('%s → CHECKSUM con FR_SIREN', (id) => {
    const r = validateFrSiren(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe('FR_SIREN');
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validateFrSiren · solo ceros (RF18)', () => {
  it('000000000 → FORMAT ALL_ZEROS con FR_SIREN (aunque Luhn da 0)', () => {
    const r = validateFrSiren('000000000');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe('FR_SIREN');
  });
});

describe('validateFrSiren · formato inválido', () => {
  it.each([
    ['73282932'], // 8 dígitos
    ['73282932000017'], // SIRET, 14: solo SIREN
    ['12345678A'],
    ['7328293200'], // 10 dígitos
  ])('%s → FORMAT sin reason ni taxIdType', (id) => {
    const r = validateFrSiren(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error).not.toHaveProperty('reason');
    expect(r.error).not.toHaveProperty('taxIdType');
  });
});
