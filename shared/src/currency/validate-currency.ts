// Validación estricta de `currency`, sin normalizar (RF13).
import { fail, ok } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';
import { CURRENCIES } from './types';
import type { Currency } from './types';

export const CURRENCY_MESSAGES = {
  invalidType: 'La divisa debe ser un texto.',
  invalidCurrency: 'La divisa debe tener tres letras mayúsculas.',
  notAvailable: 'Divisa no disponible.',
} as const;

const CURRENCY_FORMAT = /^[A-Z]{3}$/;
const SUGGESTION = CURRENCIES.join(', ');

function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** Ausente → EUR; `null` o no texto → INVALID_TYPE; formato → INVALID_CURRENCY; fuera de lista → CURRENCY_NOT_AVAILABLE. */
export function validateCurrency(raw: unknown): FieldResult<Currency> {
  if (raw === undefined) return ok('EUR');
  if (typeof raw !== 'string') return fail('currency', 'INVALID_TYPE', CURRENCY_MESSAGES.invalidType);
  if (!CURRENCY_FORMAT.test(raw)) return fail('currency', 'INVALID_CURRENCY', CURRENCY_MESSAGES.invalidCurrency);
  if (!isCurrency(raw)) {
    return fail('currency', 'CURRENCY_NOT_AVAILABLE', CURRENCY_MESSAGES.notAvailable, { suggestion: SUGGESTION });
  }
  return ok(raw);
}
