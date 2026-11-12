// Tests del validador genérico (RF20). Filas de la tabla "Resto de países" que no dependen
// de REQUIRED (esas van en validate-tax-id). La entrada llega ya normalizada.
import { describe, expect, it } from 'vitest';
import { normalizeTaxId } from './normalize-tax-id';
import { validateGenericTaxId } from './generic';

describe('validateGenericTaxId · válidos', () => {
  it.each([
    ['123456789'],
    ['000000000'], // la regla de ceros no aplica
    ['AB'], // 2 caracteres
    ['A'.repeat(20)], // 20 caracteres
    ['ABC123'],
  ])('%s → OTHER', (id) => {
    expect(validateGenericTaxId(id)).toEqual({ ok: true, value: id, taxIdType: 'OTHER' });
  });

  it('"12-3456789" normalizado → OTHER 123456789', () => {
    expect(validateGenericTaxId(normalizeTaxId('12-3456789'))).toEqual({
      ok: true,
      value: '123456789',
      taxIdType: 'OTHER',
    });
  });
});

describe('validateGenericTaxId · longitud', () => {
  it.each([['A'], ['A'.repeat(21)]])('%s → INVALID_LENGTH', (id) => {
    const r = validateGenericTaxId(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_LENGTH');
    expect(r.error).not.toHaveProperty('reason');
    expect(r.error).not.toHaveProperty('taxIdType');
    expect(r.error.message.length).toBeGreaterThan(0);
  });
});

describe('validateGenericTaxId · formato (va antes que la longitud)', () => {
  it.each([['A_'], ['_'], [`${'A'.repeat(20)}_`], ['ß123'], ['ABC_123'], ['12345678Ñ']])(
    '%s → FORMAT sin reason ni taxIdType',
    (id) => {
      const r = validateGenericTaxId(id);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
      expect(r.error).not.toHaveProperty('reason');
      expect(r.error).not.toHaveProperty('taxIdType');
    },
  );
});
