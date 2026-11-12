// Tests de la parte numérica del USt-IdNr alemán (RF10, RF11, RF15, RF18). Filas de la tabla
// "Identificador fiscal con país DE". La fila del prefijo (`DE136695976`) va en validate-tax-id (T5).
import { describe, expect, it } from 'vitest';
import { validateDeVat } from './de-vat';

describe('validateDeVat · válidos', () => {
  it.each([
    ['136695976'], // P final = 5, control 11 − 5 = 6
    ['123456788'], // P final = 3, control 8
    ['123456770'], // P final = 1 → 10 → control 0
  ])('%s → DE_VAT', (id) => {
    expect(validateDeVat(id)).toEqual({ ok: true, value: id, taxIdType: 'DE_VAT' });
  });
});

describe('validateDeVat · control incorrecto', () => {
  it.each([['136695977'], ['123456789'], ['123456771']])('%s → CHECKSUM con DE_VAT', (id) => {
    const r = validateDeVat(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe('DE_VAT');
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validateDeVat · reglas de formato con reason', () => {
  it('036695976 → FORMAT FIRST_DIGIT con DE_VAT', () => {
    const r = validateDeVat('036695976');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('FIRST_DIGIT');
    expect(r.error.taxIdType).toBe('DE_VAT');
  });

  it('000000000 → FORMAT ALL_ZEROS con DE_VAT (antes que FIRST_DIGIT)', () => {
    const r = validateDeVat('000000000');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe('DE_VAT');
  });
});

describe('validateDeVat · formato inválido', () => {
  it.each([['13669597'], ['1366959760'], ['13669597A']])(
    '%s → FORMAT sin reason ni taxIdType',
    (id) => {
      const r = validateDeVat(id);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
      expect(r.error).not.toHaveProperty('reason');
      expect(r.error).not.toHaveProperty('taxIdType');
    },
  );
});
