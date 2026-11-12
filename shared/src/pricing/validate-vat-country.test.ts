import { describe, expect, it } from 'vitest';
import { COUNTRY_MESSAGES } from '../countries/validate-country';
import { validateVatCountry } from './validate-vat-country';

function codeOf(raw: unknown): string {
  const r = validateVatCountry(raw);
  return r.ok ? 'OK' : r.error.code;
}

describe('validateVatCountry (RF9, sin normalizar)', () => {
  it.each(['ES', 'PT', 'GB', 'US', 'MX'])('%s es válido', (c) => {
    expect(validateVatCountry(c)).toEqual({ ok: true, value: c });
  });

  it.each([undefined, null, ''])('%j → REQUIRED', (raw) => {
    expect(validateVatCountry(raw)).toEqual({
      ok: false,
      error: { field: 'country', code: 'REQUIRED', message: COUNTRY_MESSAGES.REQUIRED },
    });
  });

  it.each([34, true, {}, ['ES']])('%j → INVALID_TYPE', (raw) => {
    expect(codeOf(raw)).toBe('INVALID_TYPE');
  });

  it.each(['es', 'Es', ' ES ', '   ', 'XX', 'EU', 'EL', 'XK', 'ESP', 'E'])('%j → INVALID_COUNTRY sin sugerencia', (raw) => {
    expect(validateVatCountry(raw)).toEqual({
      ok: false,
      error: { field: 'country', code: 'INVALID_COUNTRY', message: COUNTRY_MESSAGES.INVALID_COUNTRY },
    });
  });

  it('UK → INVALID_COUNTRY con suggestion GB', () => {
    expect(validateVatCountry('UK')).toEqual({
      ok: false,
      error: { field: 'country', code: 'INVALID_COUNTRY', message: '¿Querías decir GB?', suggestion: 'GB' },
    });
  });
});
