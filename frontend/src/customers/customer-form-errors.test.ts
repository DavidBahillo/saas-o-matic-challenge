import type { FieldError } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { fieldErrorText, splitFieldErrors } from './customer-form-errors';

const err = (field: string, extra: Partial<FieldError> = {}): FieldError => ({
  field,
  code: 'REQUIRED',
  message: `mensaje de ${field}`,
  ...extra,
});

describe('splitFieldErrors (RF12)', () => {
  it('coloca cada error en su control, en el orden de la respuesta', () => {
    const result = splitFieldErrors([err('email'), err('taxId')]);
    expect(result.byControl).toEqual({ email: ['mensaje de email'], taxId: ['mensaje de taxId'] });
    expect(result.general).toEqual([]);
  });

  it('un field fuera de la tabla va al aviso general', () => {
    const result = splitFieldErrors([err('simulationCount', { code: 'UNKNOWN_FIELD' }), err('plan')]);
    expect(result.general).toEqual(['mensaje de simulationCount']);
    expect(result.byControl).toEqual({ plan: ['mensaje de plan'] });
  });

  it('varios errores del mismo control se acumulan', () => {
    const result = splitFieldErrors([err('taxId'), err('taxId', { message: 'otro' })]);
    expect(result.byControl.taxId).toEqual(['mensaje de taxId', 'otro']);
  });
});

describe('fieldErrorText (RF12)', () => {
  it('traduce COUNTRY_PREFIX', () => {
    const text = fieldErrorText(err('taxId', { code: 'TAX_ID_INVALID_FORMAT', reason: 'COUNTRY_PREFIX' }));
    expect(text).toBe('El identificador fiscal no debe llevar el prefijo del país.');
  });

  it.each(['ALL_ZEROS', 'FIRST_DIGIT', 'IT_OFFICE_CODE'] as const)('traduce %s', (reason) => {
    expect(fieldErrorText(err('taxId', { reason }))).not.toBe('mensaje de taxId');
  });

  it('un reason fuera del mapa usa el message del backend', () => {
    expect(fieldErrorText(err('taxId', { reason: 'NOT_INTEGER' }))).toBe('mensaje de taxId');
  });

  it('sin reason usa el message', () => {
    expect(fieldErrorText(err('email'))).toBe('mensaje de email');
  });

  it('no repite la sugerencia si el mensaje ya la contiene', () => {
    const e = err('country', { message: '¿Querías decir GB?', suggestion: 'GB' });
    expect(fieldErrorText(e)).toBe('¿Querías decir GB?');
  });

  it('añade la sugerencia cuando el mensaje no la contiene', () => {
    const e = err('currency', { message: 'Divisa no disponible.', suggestion: 'EUR, USD, GBP' });
    expect(fieldErrorText(e)).toBe('Divisa no disponible. Sugerencia: EUR, USD, GBP.');
  });
});
