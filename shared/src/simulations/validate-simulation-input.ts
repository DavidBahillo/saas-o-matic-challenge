// Validación agregada del cuerpo de una simulación (RF4–RF8). Nunca lanza.
import type { FieldResult } from '../customers/field-result';
import type { FieldError } from '../customers/types';
import { validateCurrency } from '../currency/validate-currency';
import { UNKNOWN_FIELD_MESSAGE } from '../customers/validate-customer-input';
import { validateUsers } from '../pricing/validate-users';
import { SIMULATION_FIELDS } from './types';
import type { SimulationInput } from './types';
import { validateCustomerRef } from './validate-customer-ref';
import { validateResource } from './validate-resource';

export type SimulationInputResult =
  | { ok: true; value: SimulationInput }
  | { ok: false; errors: FieldError[] };

const ALLOWED: ReadonlySet<string> = new Set(SIMULATION_FIELDS);

/** Lee solo claves propias: una clave heredada cuenta como ausente. */
function own(raw: Readonly<Record<string, unknown>>, key: string): unknown {
  return Object.hasOwn(raw, key) ? raw[key] : undefined;
}

function unknownFieldErrors(raw: Readonly<Record<string, unknown>>): FieldError[] {
  return Object.keys(raw)
    .filter((key) => !ALLOWED.has(key))
    .map((field) => ({ field, code: 'UNKNOWN_FIELD', message: UNKNOWN_FIELD_MESSAGE }));
}

/** Orden fijo: customerId, users, storage, apiCalls y, al final, UNKNOWN_FIELD en el orden del cuerpo. */
export function validateSimulationInput(raw: Readonly<Record<string, unknown>>): SimulationInputResult {
  const customerId = validateCustomerRef(own(raw, 'customerId'));
  const users = validateUsers(own(raw, 'users'));
  const storage = validateResource('storage', own(raw, 'storage'));
  const apiCalls = validateResource('apiCalls', own(raw, 'apiCalls'));
  const currency = validateCurrency(own(raw, 'currency'));
  const results: FieldResult<unknown>[] = [customerId, users, storage, apiCalls, currency];
  const errors = results.flatMap((r) => (r.ok ? [] : [r.error])).concat(unknownFieldErrors(raw));
  if (!customerId.ok || !users.ok || !storage.ok || !apiCalls.ok || !currency.ok || errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      customerId: customerId.value,
      users: users.value,
      storage: storage.value,
      apiCalls: apiCalls.value,
      currency: currency.value,
    },
  };
}
