// Validación del número de usuarios (RF6, RF7, RF15). Nunca lanza.
import { fail, ok } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';
import type { UsersReason } from '../customers/types';
import { MAX_USERS } from './tiers';

export const USERS_MESSAGES: Readonly<Record<'REQUIRED' | 'INVALID_TYPE' | UsersReason, string>> =
  Object.freeze({
    REQUIRED: 'El número de usuarios es obligatorio.',
    INVALID_TYPE: 'El número de usuarios debe ser un número.',
    NOT_FINITE: 'El número de usuarios debe ser un número finito.',
    NOT_INTEGER: 'El número de usuarios debe ser un número entero.',
    NEGATIVE: 'El número de usuarios no puede ser negativo.',
    TOO_LARGE: 'El número de usuarios no puede ser mayor que 100 000.',
  });

function domainReason(value: number): UsersReason | null {
  if (!Number.isFinite(value)) return 'NOT_FINITE';
  if (!Number.isInteger(value)) return 'NOT_INTEGER';
  if (value < 0) return 'NEGATIVE';
  if (value > MAX_USERS) return 'TOO_LARGE';
  return null;
}

export function validateUsers(raw: unknown): FieldResult<number> {
  if (raw === undefined || raw === null) return fail('users', 'REQUIRED', USERS_MESSAGES.REQUIRED);
  if (typeof raw !== 'number') return fail('users', 'INVALID_TYPE', USERS_MESSAGES.INVALID_TYPE);
  const reason = domainReason(raw);
  if (reason !== null) return fail('users', 'INVALID_USERS', USERS_MESSAGES[reason], { reason });
  return ok(raw === 0 ? 0 : raw); // -0 → +0 (RF15)
}
