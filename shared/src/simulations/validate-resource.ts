// storage (GB) y apiCalls (llamadas/mes), RF8: opcionales, 0 por defecto, enteros 0–RESOURCE_MAX.
import { fail, ok } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';
import type { ResourceReason } from '../customers/types';
import { RESOURCE_MAX } from './types';

export const RESOURCE_MESSAGES = {
  INVALID_TYPE: 'El recurso debe ser un número.',
  NOT_INTEGER: 'El recurso debe ser un número entero.',
  NEGATIVE: 'El recurso no puede ser negativo.',
  TOO_LARGE: 'El recurso no puede superar 1 000 000.',
} as const;

function reasonFor(value: number): ResourceReason | undefined {
  if (!Number.isInteger(value)) return 'NOT_INTEGER';
  if (value < 0) return 'NEGATIVE';
  if (value > RESOURCE_MAX) return 'TOO_LARGE';
  return undefined;
}

/** undefined → ok(0); null o no número → INVALID_TYPE; NOT_INTEGER → NEGATIVE → TOO_LARGE; -0 → +0. */
export function validateResource(field: 'storage' | 'apiCalls', raw: unknown): FieldResult<number> {
  if (raw === undefined) return ok(0);
  if (typeof raw !== 'number') return fail(field, 'INVALID_TYPE', RESOURCE_MESSAGES.INVALID_TYPE);
  const reason = reasonFor(raw);
  if (reason) return fail(field, 'INVALID_RESOURCE', RESOURCE_MESSAGES[reason], { reason });
  return ok(raw === 0 ? 0 : raw);
}
