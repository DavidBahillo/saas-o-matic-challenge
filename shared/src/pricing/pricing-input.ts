// Lectura de la entrada del cálculo (RF16, RF5, D-P8). Nunca lanza.
import type { PricingResult } from './types';

export const INPUT_MESSAGES = { INVALID_TYPE: 'La entrada del cálculo debe ser un objeto.' } as const;

export interface PricingInputFields {
  readonly users: unknown;
  readonly country: unknown;
}

function ownValue(obj: object, key: string): unknown {
  // Cast seguro: solo se indexa tras comprobar con Object.hasOwn que la clave es propia; el valor sigue siendo unknown.
  return Object.hasOwn(obj, key) ? (obj as Record<string, unknown>)[key] : undefined;
}

export function readPricingInput(input: unknown): PricingResult<PricingInputFields> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ field: 'input', code: 'INVALID_TYPE', message: INPUT_MESSAGES.INVALID_TYPE }],
    };
  }
  return { ok: true, value: { users: ownValue(input, 'users'), country: ownValue(input, 'country') } };
}
