// Tests del VAT británico (RF10, RF11, RF17, RF18). Filas de la tabla "Identificador fiscal
// con país GB". La fila del prefijo (`GB980780684`) va en validate-tax-id.
import { describe, expect, it } from 'vitest';
import { normalizeTaxId } from './normalize-tax-id';
import { validateGbVat } from './gb-vat';

describe('validateGbVat · válidos', () => {
  it.each([
    ['980780684'], // S = 207, 207 + 84 = 291 = 3 · 97
    ['980780629'], // variante 9755: 207 + 55 + 29 = 291
    ['123456782'], // S = 112, 112 + 82 = 194 = 2 · 97
    ['123456727'], // variante 9755: 112 + 55 + 27 = 194
  ])('%s → GB_VAT', (id) => {
    expect(validateGbVat(id)).toEqual({ ok: true, value: id, taxIdType: 'GB_VAT' });
  });

  it('"980 7806 84" normalizado → GB_VAT 980780684', () => {
    expect(validateGbVat(normalizeTaxId('980 7806 84'))).toEqual({
      ok: true,
      value: '980780684',
      taxIdType: 'GB_VAT',
    });
  });
});

describe('validateGbVat · control incorrecto', () => {
  it.each([['980780685'], ['123456783']])('%s → CHECKSUM con GB_VAT', (id) => {
    const r = validateGbVat(id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_CHECKSUM');
    expect(r.error.taxIdType).toBe('GB_VAT');
    expect(r.error).not.toHaveProperty('reason');
  });
});

describe('validateGbVat · solo ceros', () => {
  it('000000000 → FORMAT ALL_ZEROS con GB_VAT (aunque el módulo 97 cuadre)', () => {
    const r = validateGbVat('000000000');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('ALL_ZEROS');
    expect(r.error.taxIdType).toBe('GB_VAT');
  });
});

describe('validateGbVat · formato inválido', () => {
  it.each([['980780684000'], ['98078068'], ['98078068A'], ['']])(
    '%j → FORMAT sin reason ni taxIdType',
    (id) => {
      const r = validateGbVat(id);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
      expect(r.error).not.toHaveProperty('reason');
      expect(r.error).not.toHaveProperty('taxIdType');
    },
  );
});
