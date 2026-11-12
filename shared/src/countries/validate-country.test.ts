import { describe, expect, it } from 'vitest';
import { COUNTRY_MESSAGES, checkCountryCode, validateCountry } from './validate-country';

describe('validateCountry (RF2, RF3, RF6)', () => {
  it.each([
    ['ES', 'ES'],
    ['es', 'ES'],
    [' ES ', 'ES'],
    ['\tgb\u00A0', 'GB'],
    ['Pt', 'PT'],
    ['US', 'US'],
  ])('%j → %j', (input, expected) => {
    expect(validateCountry(input)).toEqual({ ok: true, value: expected });
  });

  it.each([[''], ['   '], [null], [undefined]])('%j → REQUIRED', (input) => {
    expect(validateCountry(input)).toEqual({
      ok: false,
      error: { field: 'country', code: 'REQUIRED', message: COUNTRY_MESSAGES.REQUIRED },
    });
  });

  it.each([[34], [true], [['ES']], [{ code: 'ES' }]])('%j → INVALID_TYPE', (input) => {
    expect(validateCountry(input)).toEqual({
      ok: false,
      error: { field: 'country', code: 'INVALID_TYPE', message: COUNTRY_MESSAGES.INVALID_TYPE },
    });
  });

  it.each([['XX'], ['ESP'], ['E'], ['EU'], ['EL'], ['XK'], ['ｅｓ'], ['E S']])(
    '%j → INVALID_COUNTRY sin sugerencia',
    (input) => {
      expect(validateCountry(input)).toEqual({
        ok: false,
        error: { field: 'country', code: 'INVALID_COUNTRY', message: COUNTRY_MESSAGES.INVALID_COUNTRY },
      });
    },
  );

  it.each([['UK'], ['uk'], [' UK ']])('%j → INVALID_COUNTRY con suggestion GB', (input) => {
    expect(validateCountry(input)).toEqual({
      ok: false,
      error: {
        field: 'country',
        code: 'INVALID_COUNTRY',
        message: '¿Querías decir GB?',
        suggestion: 'GB',
      },
    });
  });
});

describe('checkCountryCode (spec 002, R1: código ya normalizado)', () => {
  it('ES → ok', () => {
    expect(checkCountryCode('ES')).toEqual({ ok: true, value: 'ES' });
  });

  it('UK → INVALID_COUNTRY con sugerencia GB', () => {
    expect(checkCountryCode('UK')).toEqual({
      ok: false,
      error: {
        field: 'country',
        code: 'INVALID_COUNTRY',
        message: '¿Querías decir GB?',
        suggestion: 'GB',
      },
    });
  });

  it.each([['uk'], [' ES '], ['   '], ['XX']])('%j → INVALID_COUNTRY sin sugerencia', (input) => {
    expect(checkCountryCode(input)).toEqual({
      ok: false,
      error: { field: 'country', code: 'INVALID_COUNTRY', message: COUNTRY_MESSAGES.INVALID_COUNTRY },
    });
  });
});
