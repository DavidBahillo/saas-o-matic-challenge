import type { FieldError, FieldErrorCode } from './types';

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: FieldError };

/** Datos opcionales de un FieldError además de campo, código y mensaje. */
export type FieldErrorExtras = Pick<FieldError, 'taxIdType' | 'reason' | 'suggestion'>;

export function ok<T>(value: T): FieldResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(
  field: string,
  code: FieldErrorCode,
  message: string,
  extras: FieldErrorExtras = {},
): FieldResult<T> {
  return { ok: false, error: { field, code, message, ...extras } };
}

/** Mensajes de los dos errores comunes a todos los campos de texto (RF3). */
export interface TextFieldMessages {
  required: string;
  invalidType: string;
}

/**
 * Lectura común de un campo de texto (RF3): ausente o `null` → REQUIRED; tipo distinto de
 * texto → INVALID_TYPE; vacío tras `normalize` → REQUIRED. Si no, devuelve el texto normalizado.
 */
export function readText(
  field: string,
  raw: unknown,
  messages: TextFieldMessages,
  normalize: (s: string) => string,
): FieldResult<string> {
  if (raw === undefined || raw === null) return fail(field, 'REQUIRED', messages.required);
  if (typeof raw !== 'string') return fail(field, 'INVALID_TYPE', messages.invalidType);
  const value = normalize(raw);
  return value === '' ? fail(field, 'REQUIRED', messages.required) : ok(value);
}
