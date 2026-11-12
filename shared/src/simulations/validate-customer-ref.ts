// customerId de una simulación, RF6: obligatorio y entero seguro ≥ 1.
import { fail, ok } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';

export const CUSTOMER_REF_MESSAGES = {
  REQUIRED: 'El cliente es obligatorio.',
  INVALID_TYPE: 'El cliente debe ser un número.',
  INVALID_ID: 'El cliente debe ser un id entero positivo.',
} as const;

const FIELD = 'customerId';

/** undefined/null → REQUIRED; no número → INVALID_TYPE; no entero seguro ≥ 1 (incluido -0) → INVALID_ID. */
export function validateCustomerRef(raw: unknown): FieldResult<number> {
  if (raw === undefined || raw === null) return fail(FIELD, 'REQUIRED', CUSTOMER_REF_MESSAGES.REQUIRED);
  if (typeof raw !== 'number') return fail(FIELD, 'INVALID_TYPE', CUSTOMER_REF_MESSAGES.INVALID_TYPE);
  if (!Number.isSafeInteger(raw) || raw < 1) {
    return fail(FIELD, 'INVALID_ID', CUSTOMER_REF_MESSAGES.INVALID_ID);
  }
  return ok(raw);
}
