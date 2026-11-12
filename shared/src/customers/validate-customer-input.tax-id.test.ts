import { describe, expect, it } from 'vitest';
import { TAX_ID_MESSAGES } from '../taxid/result';
import { TAX_ID_REQUIRED_MESSAGE } from '../taxid/validate-tax-id';
import { TAX_ID_FIELD_MESSAGES, validateCustomerInput } from './validate-customer-input';

const VALID = {
  companyName: 'Acme Ibérica SL',
  taxId: 'b-1234567-4',
  email: '  Compras@Acme.ES ',
  country: 'es',
  plan: 'growth',
} as const;

type Input = Readonly<Record<string, unknown>>;

/** Pares [campo, código] de los errores, en el orden en que se devuelven. */
function codes(input: Input): [string, string][] {
  const result = validateCustomerInput(input);
  if (result.ok) return [];
  return result.errors.map((e) => [e.field, e.code]);
}

describe('validateCustomerInput: tax ID (RF3, RF8, RF10)', () => {
  it.each([[null], [''], ['   '], ['-.-']])('taxId %j con ES → REQUIRED', (taxId) => {
    const result = validateCustomerInput({ ...VALID, taxId });
    expect(result).toEqual({
      ok: false,
      errors: [{ field: 'taxId', code: 'REQUIRED', message: TAX_ID_REQUIRED_MESSAGE }],
    });
  });

  it('taxId 12345678 como número → INVALID_TYPE', () => {
    const result = validateCustomerInput({ ...VALID, taxId: 12345678 });
    expect(result).toEqual({
      ok: false,
      errors: [{ field: 'taxId', code: 'INVALID_TYPE', message: TAX_ID_FIELD_MESSAGES.INVALID_TYPE }],
    });
  });

  it('conserva reason y taxIdType del validador del país', () => {
    const result = validateCustomerInput({ ...VALID, taxId: '00000000T' });
    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'taxId',
          code: 'TAX_ID_INVALID_FORMAT',
          reason: 'ALL_ZEROS',
          taxIdType: 'DNI',
          message: TAX_ID_MESSAGES.ALL_ZEROS,
        },
      ],
    });
  });

  it.each([
    ['ES', '12345678Z\n-'],
    ['US', '-\n-'],
  ])('%s + %j → TAX_ID_INVALID_FORMAT: el tax ID se normaliza una sola vez (RF2, T11)', (country, taxId) => {
    const result = validateCustomerInput({ ...VALID, country, taxId });
    expect(result).toEqual({
      ok: false,
      errors: [{ field: 'taxId', code: 'TAX_ID_INVALID_FORMAT', message: TAX_ID_MESSAGES.FORMAT }],
    });
  });

  it('US con A → INVALID_LENGTH en taxId', () => {
    expect(codes({ ...VALID, country: 'US', taxId: 'A' })).toEqual([['taxId', 'INVALID_LENGTH']]);
  });

  it('XX + 12345678A → un único error INVALID_COUNTRY (RF8)', () => {
    expect(codes({ ...VALID, country: 'XX', taxId: '12345678A' })).toEqual([
      ['country', 'INVALID_COUNTRY'],
    ]);
  });

  it.each([
    ['sin taxId', { country: 'XX', taxId: undefined }, 'REQUIRED'],
    ['taxId null', { country: 'XX', taxId: null }, 'REQUIRED'],
    ['taxId vacío tras normalizar', { country: 'XX', taxId: ' - ' }, 'REQUIRED'],
    ['taxId 123 como número', { country: 'XX', taxId: 123 }, 'INVALID_TYPE'],
  ])('XX y %s → INVALID_COUNTRY y %s en taxId', (_label, patch, taxIdCode) => {
    const input: Record<string, unknown> = { ...VALID, ...patch };
    if (patch.taxId === undefined) delete input.taxId;
    expect(codes(input)).toEqual([
      ['taxId', taxIdCode],
      ['country', 'INVALID_COUNTRY'],
    ]);
  });

  it.each([
    ['falta', undefined, 'REQUIRED'],
    ['es null', null, 'REQUIRED'],
    ['tiene un tipo erróneo', 34, 'INVALID_TYPE'],
    ['es UK', 'UK', 'INVALID_COUNTRY'],
  ])('si country %s, el taxId no se valida por formato (RF8)', (_label, country, countryCode) => {
    const input: Record<string, unknown> = { ...VALID, country, taxId: 'ESB12345674' };
    if (country === undefined) delete input.country;
    expect(codes(input)).toEqual([['country', countryCode]]);
  });

  it('UK incluye suggestion GB en el error de country', () => {
    const result = validateCustomerInput({ ...VALID, country: 'UK' });
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: 'country', code: 'INVALID_COUNTRY', message: '¿Querías decir GB?', suggestion: 'GB' },
      ],
    });
  });
});
