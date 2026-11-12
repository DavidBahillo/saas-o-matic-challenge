// Tests del NIF/NIPC portugués (RF10, RF11, RF13, RF18). Filas de la tabla "Identificador
// fiscal con país PT". La fila del prefijo (`PT501964843`) va en validate-tax-id (T5).
import { describe, expect, it } from 'vitest';
import { normalizeTaxId } from './normalize-tax-id';
import { validatePtNif } from './pt-nif';

describe('validatePtNif · válidos', () => {
  it.each([
    ['501964843'], // S = 184, mod 11 = 8, control 3
    ['123456789'], // S = 156, mod 11 = 2, control 9
    ['500000000'], // S = 45, mod 11 = 1 → 10 → control 0
    ['500000050'], // S = 55, mod 11 = 0 → 11 → control 0
  ])('%s → PT_NIF', (id) => {
    expect(validatePtNif(id)).toEqual({ ok: true, value: id, taxIdType: 'PT_NIF' });
  });

  it('501 964 843 se guarda como 501964843 tras normalizar', () => {
    expect(validatePtNif(normalizeTaxId('501 964 843'))).toEqual({
      ok: true,
      value: '501964843',
      taxIdType: 'PT_NIF',
    });
  });
});

describe('validatePtNif · control incorrecto', () => {
  it.each([['501964842'], ['500000001'], ['123456780']])('%s → CHECKSUM con PT_NIF', (id) => {
    const r = validatePtNif(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe('PT_NIF');
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validatePtNif · reglas de formato con reason', () => {
  it('012345678 → FORMAT FIRST_DIGIT con PT_NIF', () => {
    const r = validatePtNif('012345678');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('FIRST_DIGIT');
    expect(r.error.taxIdType).toBe('PT_NIF');
  });

  it('000000000 → FORMAT ALL_ZEROS con PT_NIF (antes que FIRST_DIGIT)', () => {
    const r = validatePtNif('000000000');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe('PT_NIF');
  });
});

describe('validatePtNif · formato inválido', () => {
  it.each([['50196484'], ['5019648430'], ['50196484A'], ['']])(
    '%s → FORMAT sin reason ni taxIdType',
    (id) => {
      const r = validatePtNif(id);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
      expect(r.error).not.toHaveProperty('reason');
      expect(r.error).not.toHaveProperty('taxIdType');
    },
  );
});
