// Errores HTTP de la API (constitución, principio 8; plan §6.4): { error: { code, message, details? } }
// con 400, 404, 409 o 500. Los mensajes son genéricos y en español; nunca exponen detalles internos.
import type { ApiErrorBody, ApiErrorCode, FieldError } from '@saas-o-matic/shared';

export type HttpStatus = 400 | 404 | 409 | 500;
type ErrorDetails = NonNullable<ApiErrorBody['error']['details']>;

export const MAX_BODY_BYTES = 10_240;

export const API_MESSAGES = {
  VALIDATION_ERROR: 'La petición contiene campos no válidos.',
  UNSUPPORTED_CONTENT_TYPE: 'El cuerpo debe enviarse con Content-Type: application/json.',
  PAYLOAD_TOO_LARGE: 'El cuerpo de la petición supera el máximo de 10 240 bytes.',
  MALFORMED_JSON: 'El cuerpo de la petición no es un JSON válido.',
  NOT_FOUND: 'La ruta solicitada no existe.',
  INTERNAL_ERROR: 'Error interno del servidor.',
  EXCHANGE_RATE_UNAVAILABLE: 'No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde.',
  BODY_INVALID_TYPE: 'El cuerpo debe ser un objeto JSON.',
} as const;

export class HttpError extends Error {
  override readonly name = 'HttpError';
  constructor(
    readonly status: HttpStatus,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
  }

  toBody(): ApiErrorBody {
    const error: ApiErrorBody['error'] = { code: this.code, message: this.message };
    if (this.details !== undefined) error.details = this.details;
    return { error };
  }
}

export function validationError(fields: FieldError[]): HttpError {
  return new HttpError(400, 'VALIDATION_ERROR', API_MESSAGES.VALIDATION_ERROR, { fields });
}

export function unsupportedContentType(): HttpError {
  return new HttpError(400, 'UNSUPPORTED_CONTENT_TYPE', API_MESSAGES.UNSUPPORTED_CONTENT_TYPE);
}

export function payloadTooLarge(): HttpError {
  return new HttpError(400, 'PAYLOAD_TOO_LARGE', API_MESSAGES.PAYLOAD_TOO_LARGE);
}

export function malformedJson(): HttpError {
  return new HttpError(400, 'MALFORMED_JSON', API_MESSAGES.MALFORMED_JSON);
}

export function routeNotFound(): HttpError {
  return new HttpError(404, 'NOT_FOUND', API_MESSAGES.NOT_FOUND);
}

export function customerNotFound(id: number): HttpError {
  return new HttpError(404, 'CUSTOMER_NOT_FOUND', `No existe el cliente ${String(id)}.`);
}

/** Sin `existingId` cuando el cliente en conflicto ya no existe (carrera con un borrado, 009 RF15). */
export function customerAlreadyExists(country: string, existingId?: number): HttpError {
  const message = `Ya existe un cliente con ese identificador fiscal en ${country}.`;
  return new HttpError(409, 'CUSTOMER_ALREADY_EXISTS', message, existingId === undefined ? undefined : { existingId });
}

export function internalError(): HttpError {
  return new HttpError(500, 'INTERNAL_ERROR', API_MESSAGES.INTERNAL_ERROR);
}

export function simulationNotFound(id: number): HttpError {
  return new HttpError(404, 'SIMULATION_NOT_FOUND', `No existe la simulación ${String(id)}.`);
}

/** 500 sin `details`: la causa va a console.error, nunca a la respuesta (RF16). */
export function exchangeRateUnavailable(): HttpError {
  return new HttpError(500, 'EXCHANGE_RATE_UNAVAILABLE', API_MESSAGES.EXCHANGE_RATE_UNAVAILABLE);
}
