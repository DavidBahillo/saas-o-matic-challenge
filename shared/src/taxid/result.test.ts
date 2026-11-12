import { describe, expect, it } from 'vitest';
import { checksumError, countryPrefixError, countryPrefixMessage, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

function errorOf(r: TaxIdResult) {
  if (r.ok) throw new Error('se esperaba un error');
  return r.error;
}

describe('taxIdOk', () => {
  it('devuelve el valor y el tipo', () => {
    expect(taxIdOk('12345678Z', 'DNI')).toEqual({ ok: true, value: '12345678Z', taxIdType: 'DNI' });
  });
});

describe('formatError (RF11)', () => {
  it('sin reason no incluye reason ni taxIdType', () => {
    const error = errorOf(formatError());
    expect(error.code).toBe('TAX_ID_INVALID_FORMAT');
    expect(error).not.toHaveProperty('reason');
    expect(error).not.toHaveProperty('taxIdType');
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('sin reason ignora el taxIdType aunque se pase', () => {
    expect(errorOf(formatError(undefined, 'DNI'))).not.toHaveProperty('taxIdType');
  });

  it.each([
    ['ALL_ZEROS', 'NIE'],
    ['FIRST_DIGIT', 'PT_NIF'],
    ['IT_OFFICE_CODE', 'IT_PIVA'],
  ] as const)('%s incluye el taxIdType %s', (reason, taxIdType) => {
    expect(errorOf(formatError(reason, taxIdType))).toMatchObject({
      code: 'TAX_ID_INVALID_FORMAT',
      reason,
      taxIdType,
    });
  });
});

describe('countryPrefixError (RF19)', () => {
  it('nombra el país en el mensaje, como el ejemplo del contrato', () => {
    expect(countryPrefixMessage('GB')).toBe('Introduce el identificador fiscal sin el prefijo GB.');
  });

  it.each(['ES', 'PT', 'FR', 'DE', 'IT', 'GB'])('%s → FORMAT COUNTRY_PREFIX sin taxIdType', (country) => {
    expect(countryPrefixError(country)).toEqual({
      ok: false,
      error: {
        code: 'TAX_ID_INVALID_FORMAT',
        reason: 'COUNTRY_PREFIX',
        message: `Introduce el identificador fiscal sin el prefijo ${country}.`,
      },
    });
  });
});

describe('checksumError', () => {
  it('incluye el taxIdType detectado y no lleva reason', () => {
    const error = errorOf(checksumError('CIF'));
    expect(error).toMatchObject({ code: 'TAX_ID_INVALID_CHECKSUM', taxIdType: 'CIF' });
    expect(error).not.toHaveProperty('reason');
  });
});
