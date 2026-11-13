// Errores de la API (RF14, RF34): nunca se muestra una traza ni JSON en bruto.
import type { ApiErrorCode, FieldError } from '@saas-o-matic/shared';
import { apiErrorSchema } from './error-schema';

export type ApiErrorKind = 'api' | 'network' | 'invalid-response';

export const GENERAL_ERROR_MESSAGE = 'Algo ha salido mal. Comprueba la conexión e inténtalo de nuevo.';

export interface ApiErrorExtras {
  status?: number;
  code?: ApiErrorCode;
  fields?: FieldError[];
  existingId?: number;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly code: ApiErrorCode | undefined;
  readonly fields: FieldError[];
  readonly existingId: number | undefined;

  constructor(kind: ApiErrorKind, message: string, extras: ApiErrorExtras = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = extras.status;
    this.code = extras.code;
    this.fields = extras.fields ?? [];
    this.existingId = extras.existingId;
  }
}

/** Convierte una respuesta no 2xx; si no tiene la forma { error: { code, message, details? } }, es invalid-response. */
export function toApiError(status: number, body: unknown): ApiError {
  const parsed = apiErrorSchema.safeParse(body);
  if (!parsed.success) return new ApiError('invalid-response', GENERAL_ERROR_MESSAGE, { status });
  const { code, message, details } = parsed.data.error;
  return new ApiError('api', message, {
    status,
    code,
    ...(details?.fields === undefined ? {} : { fields: details.fields }),
    ...(details?.existingId === undefined ? {} : { existingId: details.existingId }),
  });
}

/** El message del backend o el texto general en español. */
export function generalMessage(error: unknown): string {
  return error instanceof ApiError && error.kind === 'api' ? error.message : GENERAL_ERROR_MESSAGE;
}
