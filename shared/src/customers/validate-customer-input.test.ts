import { describe, expect, it } from 'vitest';
import { validateCustomerInput } from './validate-customer-input';

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

describe('validateCustomerInput: alta válida', () => {
  it('devuelve el NewCustomer normalizado del ejemplo del contrato', () => {
    expect(validateCustomerInput(VALID)).toEqual({
      ok: true,
      value: {
        companyName: 'Acme Ibérica SL',
        taxId: 'B12345674',
        taxIdType: 'CIF',
        email: 'compras@acme.es',
        country: 'ES',
        plan: 'growth',
      },
    });
  });

  it.each([['es'], [' ES ']])('12345678Z con country %j → ES y validación española', (country) => {
    const result = validateCustomerInput({ ...VALID, country, taxId: '12345678Z' });
    expect(result).toMatchObject({ ok: true, value: { country: 'ES', taxId: '12345678Z', taxIdType: 'DNI' } });
  });

  it.each([
    ['GB', 'GB_VAT'],
    ['US', 'OTHER'],
  ])('980780684 en %s → válido como %s (unicidad por país)', (country, taxIdType) => {
    const result = validateCustomerInput({ ...VALID, country, taxId: '980780684' });
    expect(result).toMatchObject({ ok: true, value: { country, taxId: '980780684', taxIdType } });
  });
});

describe('validateCustomerInput: varios errores a la vez (RF3)', () => {
  it('devuelve un error por campo, en el orden de los campos y después los desconocidos', () => {
    const input = {
      companyName: 'A',
      taxId: '12345678A',
      email: 'ventas@acme',
      country: 'ES',
      plan: 'pro',
      discount: 10,
    };
    expect(codes(input)).toEqual([
      ['companyName', 'INVALID_LENGTH'],
      ['taxId', 'TAX_ID_INVALID_CHECKSUM'],
      ['email', 'INVALID_EMAIL'],
      ['plan', 'INVALID_PLAN'],
      ['discount', 'UNKNOWN_FIELD'],
    ]);
  });

  it('todos los campos a null → REQUIRED en cada uno', () => {
    const input = { companyName: null, taxId: null, email: null, country: null, plan: null };
    expect(codes(input)).toEqual([
      ['companyName', 'REQUIRED'],
      ['taxId', 'REQUIRED'],
      ['email', 'REQUIRED'],
      ['country', 'REQUIRED'],
      ['plan', 'REQUIRED'],
    ]);
  });

  it('objeto vacío → REQUIRED en los 5 campos', () => {
    expect(codes({})).toHaveLength(5);
    expect(codes({}).every(([, code]) => code === 'REQUIRED')).toBe(true);
  });

  it('tipos distintos de texto → INVALID_TYPE en cada campo', () => {
    const input = { companyName: 1, taxId: 12345678, email: true, country: ['ES'], plan: {} };
    expect(codes(input).map(([, code]) => code)).toEqual(Array(5).fill('INVALID_TYPE'));
  });

  it('ejemplo del contrato: GB con prefijo y email no válido', () => {
    const result = validateCustomerInput({ ...VALID, country: 'GB', taxId: 'GB980780684', email: 'x@' });
    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'taxId',
          code: 'TAX_ID_INVALID_FORMAT',
          reason: 'COUNTRY_PREFIX',
          message: 'Introduce el identificador fiscal sin el prefijo GB.',
        },
        { field: 'email', code: 'INVALID_EMAIL', message: expect.any(String) as unknown },
      ],
    });
  });
});

describe('validateCustomerInput: campos desconocidos (RF3)', () => {
  it('"discount": 10 → UNKNOWN_FIELD en discount', () => {
    const result = validateCustomerInput({ ...VALID, discount: 10 });
    expect(result).toEqual({
      ok: false,
      errors: [{ field: 'discount', code: 'UNKNOWN_FIELD', message: expect.any(String) as unknown }],
    });
  });

  it('__proto__ como clave propia (JSON.parse) → UNKNOWN_FIELD', () => {
    const input = JSON.parse(`{"__proto__": 1, ${JSON.stringify(VALID).slice(1)}`) as Input;
    expect(codes(input)).toEqual([['__proto__', 'UNKNOWN_FIELD']]);
  });

  it('no confunde propiedades heredadas con campos', () => {
    const input = Object.create({ companyName: 'Heredada SL' }) as Record<string, unknown>;
    expect(codes(input)[0]).toEqual(['companyName', 'REQUIRED']);
  });
});
