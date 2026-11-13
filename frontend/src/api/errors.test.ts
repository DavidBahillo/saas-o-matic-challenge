import { describe, expect, it } from 'vitest';
import { ApiError, GENERAL_ERROR_MESSAGE, generalMessage, toApiError } from './errors';

describe('toApiError (RF34)', () => {
  it('interpreta { error: { code, message, details } }', () => {
    const error = toApiError(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos no válidos.',
        details: {
          fields: [{ field: 'country', code: 'INVALID_COUNTRY', message: 'País no válido.', suggestion: 'GB' }],
        },
      },
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('api');
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fields).toEqual([
      { field: 'country', code: 'INVALID_COUNTRY', message: 'País no válido.', suggestion: 'GB' },
    ]);
  });

  it('recoge existingId del 409', () => {
    const error = toApiError(409, {
      error: { code: 'CUSTOMER_ALREADY_EXISTS', message: 'Ya existe.', details: { existingId: 4 } },
    });
    expect(error.existingId).toBe(4);
    expect(error.fields).toEqual([]);
  });

  it.each([
    ['sin cuerpo', undefined],
    ['texto', 'Internal Server Error at /srv/app.js:10'],
    ['sin message', { error: { code: 'INTERNAL_ERROR' } }],
    ['código desconocido', { error: { code: 'RARO', message: 'x' } }],
    ['forma distinta', { message: 'boom' }],
  ])('un cuerpo inesperado (%s) es invalid-response con el mensaje general', (_name, body) => {
    const error = toApiError(500, body);
    expect(error.kind).toBe('invalid-response');
    expect(error.status).toBe(500);
    expect(generalMessage(error)).toBe(GENERAL_ERROR_MESSAGE);
  });
});

describe('generalMessage', () => {
  it('usa el message del backend solo en errores de la API', () => {
    const error = toApiError(500, { error: { code: 'EXCHANGE_RATE_UNAVAILABLE', message: 'Sin tipos de cambio.' } });
    expect(generalMessage(error)).toBe('Sin tipos de cambio.');
  });

  it('usa el texto general con red caída o con cualquier otro error', () => {
    expect(generalMessage(new ApiError('network', 'Failed to fetch'))).toBe(GENERAL_ERROR_MESSAGE);
    expect(generalMessage(new Error('stack trace'))).toBe(GENERAL_ERROR_MESSAGE);
    expect(generalMessage('x')).toBe(GENERAL_ERROR_MESSAGE);
  });
});
