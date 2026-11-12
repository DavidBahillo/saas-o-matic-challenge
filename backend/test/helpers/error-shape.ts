// Comprobación de la forma de las respuestas de error (CA6 y tabla "Códigos de error" de la spec):
// { error: { code, message, details? } }, solo los códigos de la tabla y solo 400, 404, 409 y 500.
import { TAX_ID_TYPES } from '@saas-o-matic/shared';
import type { ApiErrorCode, FieldErrorCode } from '@saas-o-matic/shared';
import type request from 'supertest';
import { expect } from 'vitest';

/** Estado HTTP de cada código de la tabla de la spec. */
export const STATUS_BY_CODE: Readonly<Record<ApiErrorCode, 400 | 404 | 409 | 500>> = {
  VALIDATION_ERROR: 400,
  UNSUPPORTED_CONTENT_TYPE: 400,
  PAYLOAD_TOO_LARGE: 400,
  MALFORMED_JSON: 400,
  CUSTOMER_NOT_FOUND: 404,
  SIMULATION_NOT_FOUND: 404,
  NOT_FOUND: 404,
  CUSTOMER_ALREADY_EXISTS: 409,
  INTERNAL_ERROR: 500,
};

export const FIELD_CODES: readonly FieldErrorCode[] = [
  'REQUIRED',
  'INVALID_TYPE',
  'UNKNOWN_FIELD',
  'INVALID_LENGTH',
  'INVALID_CHARACTERS',
  'INVALID_EMAIL',
  'INVALID_COUNTRY',
  'INVALID_PLAN',
  'INVALID_ID',
  'TAX_ID_INVALID_FORMAT',
  'TAX_ID_INVALID_CHECKSUM',
];

/** Códigos de campo de la 002/003; FIELD_CODES sigue siendo el catálogo exacto de la 001. */
const ALL_FIELD_CODES: readonly string[] = [...FIELD_CODES, 'INVALID_USERS', 'INVALID_RESOURCE'];

const REASONS: readonly string[] = ['COUNTRY_PREFIX', 'ALL_ZEROS', 'FIRST_DIGIT', 'IT_OFFICE_CODE',
  // 002/003: motivos de INVALID_USERS e INVALID_RESOURCE.
  'NOT_INTEGER', 'NEGATIVE', 'TOO_LARGE'];
const FIELD_KEYS: readonly string[] = ['field', 'code', 'message', 'taxIdType', 'reason', 'suggestion'];

function expectSubset(keys: readonly string[], allowed: readonly string[]): void {
  expect(keys.filter((key) => !allowed.includes(key))).toEqual([]);
}

function expectFieldError(entry: unknown): void {
  const fieldError = entry as Record<string, unknown>;
  expectSubset(Object.keys(fieldError), FIELD_KEYS);
  expect(typeof fieldError.field).toBe('string');
  expect(ALL_FIELD_CODES).toContain(fieldError.code);
  expect(typeof fieldError.message).toBe('string');
  if ('reason' in fieldError) expect(REASONS).toContain(fieldError.reason);
  if ('taxIdType' in fieldError) expect(TAX_ID_TYPES).toContain(fieldError.taxIdType);
  if ('suggestion' in fieldError) expect(typeof fieldError.suggestion).toBe('string');
}

/** `details` solo existe en VALIDATION_ERROR (fields) y en CUSTOMER_ALREADY_EXISTS (existingId). */
function expectDetails(code: unknown, details: unknown): void {
  if (code === 'VALIDATION_ERROR') {
    const { fields } = details as { fields: unknown[] };
    expect(Object.keys(details as object)).toEqual(['fields']);
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach(expectFieldError);
  } else if (code === 'CUSTOMER_ALREADY_EXISTS') {
    expect(details).toEqual({ existingId: expect.any(Number) as number });
  } else {
    expect(details).toBeUndefined();
  }
}

/** Comprueba la forma completa y devuelve el código de error. */
export function expectErrorShape(res: request.Response): ApiErrorCode {
  expect(res.headers['content-type']).toMatch(/^application\/json/);
  expect(Object.keys(res.body as object)).toEqual(['error']);
  const { error } = res.body as { error: Record<string, unknown> };
  expectSubset(Object.keys(error), ['code', 'message', 'details']);
  expect(Object.keys(STATUS_BY_CODE)).toContain(error.code);
  const code = error.code as ApiErrorCode;
  expect(res.status).toBe(STATUS_BY_CODE[code]);
  expect(typeof error.message).toBe('string');
  expect((error.message as string).length).toBeGreaterThan(0);
  expectDetails(code, error.details);
  return code;
}

/** Códigos de campo presentes en una respuesta de error. */
export function fieldCodesOf(res: request.Response): string[] {
  const body = res.body as { error: { details?: { fields?: { code: string }[] } } };
  return (body.error.details?.fields ?? []).map((field) => field.code);
}
