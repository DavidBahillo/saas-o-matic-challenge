import { describe, expect, it } from 'vitest';
import { ApiError, GENERAL_ERROR_MESSAGE } from '../api/errors';
import { describeSimulationError } from './simulator-errors';

const api = (status: number, code: ApiError['code'], message: string, fields: ApiError['fields'] = []) =>
  new ApiError('api', message, { status, ...(code === undefined ? {} : { code }), fields });

describe('describeSimulationError (RF27)', () => {
  it('400: cada error en su control y el resto en el aviso general', () => {
    const view = describeSimulationError(
      api(400, 'VALIDATION_ERROR', 'Datos no válidos.', [
        { field: 'users', code: 'INVALID_USERS', message: 'Usuarios no válidos.' },
        { field: 'currency', code: 'CURRENCY_NOT_AVAILABLE', message: 'Divisa no disponible.', suggestion: 'EUR, USD, GBP' },
        { field: 'customerId', code: 'INVALID_TYPE', message: 'Cliente no válido.' },
      ]),
    );
    expect(view.byControl).toEqual({
      users: ['Usuarios no válidos.'],
      currency: ['Divisa no disponible. Sugerencia: EUR, USD, GBP.'],
    });
    expect(view.general).toEqual(['Cliente no válido.']);
    expect(view.kind).toBe('validation');
  });

  it('404 CUSTOMER_NOT_FOUND: cliente no encontrado', () => {
    expect(describeSimulationError(api(404, 'CUSTOMER_NOT_FOUND', 'x')).kind).toBe('not-found');
  });

  it('500 EXCHANGE_RATE_UNAVAILABLE: tipo no disponible, con explicación propia', () => {
    const view = describeSimulationError(api(500, 'EXCHANGE_RATE_UNAVAILABLE', 'x'));
    expect(view.kind).toBe('rate-unavailable');
    expect(view.general[0]).toContain('tipo de cambio');
  });

  it('cualquier otro fallo es un error general con reintento y sin JSON', () => {
    const net = describeSimulationError(new ApiError('network', GENERAL_ERROR_MESSAGE));
    expect(net).toEqual({ kind: 'general', byControl: {}, general: [GENERAL_ERROR_MESSAGE] });
    expect(describeSimulationError(new Error('boom')).general).toEqual([GENERAL_ERROR_MESSAGE]);
  });
});
