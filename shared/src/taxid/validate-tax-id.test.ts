// Tests del punto de entrada `validateTaxId` (RF2, RF9, RF10, RF19, RF20): normalización,
// REQUIRED, prefijo de país en los 6 países con algoritmo y despacho al validador de cada país.
import { describe, expect, it } from 'vitest';
import type { TaxIdType } from '../customers/types';
import { TAX_ID_MESSAGES } from './result';
import { validateNormalizedTaxId, validateTaxId } from './validate-tax-id';

describe('validateTaxId · REQUIRED tras normalizar (RF10 paso 1)', () => {
  it.each([
    ['ES', ''],
    ['ES', '   '],
    ['ES', '-.-'],
    ['ES', '\r\n'],
    ['IT', '\u00A0.\u202F'],
    ['US', '-'],
    ['US', ' . '],
    ['US', ''],
  ])('%s %j → REQUIRED', (country, raw) => {
    const r = validateTaxId(country, raw);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('REQUIRED');
    expect(r.error).not.toHaveProperty('reason');
    expect(r.error).not.toHaveProperty('taxIdType');
    expect(r.error.message.length).toBeGreaterThan(0);
  });
});

describe('validateTaxId · COUNTRY_PREFIX sin taxIdType (RF19)', () => {
  it.each([
    ['ES', 'ES12345678Z'],
    ['ES', 'ESB12345674'],
    ['ES', 'es 12345678-z'],
    ['PT', 'PT501964843'],
    ['FR', 'FR732829320'],
    ['FR', 'FR44732829320'],
    ['DE', 'DE136695976'],
    ['IT', 'IT00743110157'],
    ['GB', 'GB980780684'],
    ['GB', 'gb 980 7806 84'],
  ])('%s %j → FORMAT COUNTRY_PREFIX', (country, raw) => {
    const r = validateTaxId(country, raw);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error.reason).toBe('COUNTRY_PREFIX');
    expect(r.error).not.toHaveProperty('taxIdType');
    expect(r.error.message).toBe(`Introduce el identificador fiscal sin el prefijo ${country}.`);
  });

  it('el prefijo solo se busca para el país indicado: PT + ES… → FORMAT sin reason', () => {
    const r = validateTaxId('PT', 'ES501964843');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(r.error).not.toHaveProperty('reason');
  });

  it('en el resto de países no hay regla de prefijo: US + US123 → OTHER', () => {
    expect(validateTaxId('US', 'US123')).toEqual({ ok: true, value: 'US123', taxIdType: 'OTHER' });
  });
});

describe('validateTaxId · despacho por país con normalización', () => {
  it.each<[string, string, string, TaxIdType]>([
    ['ES', ' 12.345.678-z ', '12345678Z', 'DNI'],
    ['ES', 'x1234567l', 'X1234567L', 'NIE'],
    ['ES', 'B-12345674', 'B12345674', 'CIF'],
    ['PT', '501 964 843', '501964843', 'PT_NIF'],
    ['FR', '732 829 320', '732829320', 'FR_SIREN'],
    ['DE', '136695976', '136695976', 'DE_VAT'],
    ['IT', '007 4311 0157', '00743110157', 'IT_PIVA'],
    ['GB', '980 7806 84', '980780684', 'GB_VAT'],
    ['US', '12-3456789', '123456789', 'OTHER'],
    ['US', '000000000', '000000000', 'OTHER'],
    ['MX', 'abc123', 'ABC123', 'OTHER'],
  ])('%s %j → %s %s', (country, raw, value, taxIdType) => {
    expect(validateTaxId(country, raw)).toEqual({ ok: true, value, taxIdType });
  });

  it.each<[string, string, string, TaxIdType?]>([
    ['ES', '12345678A', 'TAX_ID_INVALID_CHECKSUM', 'DNI'],
    ['PT', '012345678', 'TAX_ID_INVALID_FORMAT', 'PT_NIF'],
    ['FR', '732829321', 'TAX_ID_INVALID_CHECKSUM', 'FR_SIREN'],
    ['DE', '136695977', 'TAX_ID_INVALID_CHECKSUM', 'DE_VAT'],
    ['IT', '12345671015', 'TAX_ID_INVALID_FORMAT', 'IT_PIVA'],
    ['GB', '000000000', 'TAX_ID_INVALID_FORMAT', 'GB_VAT'],
    ['US', 'A', 'INVALID_LENGTH'],
    ['US', 'ß123', 'TAX_ID_INVALID_FORMAT'],
    ['MX', 'ABC_123', 'TAX_ID_INVALID_FORMAT'],
  ])('%s %j → %s %s', (country, raw, code, taxIdType) => {
    const r = validateTaxId(country, raw);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe(code);
    expect(r.error.taxIdType).toBe(taxIdType);
  });
});

describe('validateTaxId · la normalización se aplica una sola vez (RF2, T11)', () => {
  it.each([
    ['ES', '12345678Z\n-'],
    ['US', '-\n-'],
  ])('%s %j → TAX_ID_INVALID_FORMAT sin reason (el salto final no se recorta otra vez)', (country, raw) => {
    const r = validateTaxId(country, raw);
    expect(r).toEqual({
      ok: false,
      error: { code: 'TAX_ID_INVALID_FORMAT', message: TAX_ID_MESSAGES.FORMAT },
    });
  });

  it('validateNormalizedTaxId no vuelve a normalizar: 12345678Z + salto final → FORMAT', () => {
    const r = validateNormalizedTaxId('ES', '12345678Z\n');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('TAX_ID_INVALID_FORMAT');
  });

  it('validateNormalizedTaxId("ES", "") → REQUIRED', () => {
    const r = validateNormalizedTaxId('ES', '');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('REQUIRED');
  });

  it('validateNormalizedTaxId tampoco pasa a mayúsculas: "b12345674" → FORMAT', () => {
    const r = validateNormalizedTaxId('ES', 'b12345674');
    expect(r.ok).toBe(false);
  });
});
