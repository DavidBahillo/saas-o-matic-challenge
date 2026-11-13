// Texto decimal del tipo → micro-unidades, sin pasar por coma flotante (RF11, RF12).
import { MICROS_PER_UNIT, RATE_MAX_MICROS, RATE_MIN_MICROS } from './types';
import type { RateMicros } from './types';

export type ParseRateResult = { ok: true; micros: RateMicros } | { ok: false };

const DECIMAL = /^([0-9]+)(?:\.([0-9]+))?$/;
const MAX_INTEGER_DIGITS = 3;
const FRACTION_DIGITS = 6;

/** Valor de una cadena de dígitos ya validada, acumulando dígito a dígito (sin Number sobre el texto). */
function digitsToInt(digits: string): number {
  let value = 0;
  for (let i = 0; i < digits.length; i += 1) value = value * 10 + (digits.charCodeAt(i) - 48);
  return value;
}

/** Texto `^[0-9]+(\.[0-9]+)?$` → micro-unidades, half-up a 6 decimales, dentro del rango de RF12. */
export function parseRateText(text: string): ParseRateResult {
  const match = DECIMAL.exec(text);
  if (match === null) return { ok: false };
  const integerDigits = (match[1] ?? '').replace(/^0+/, '');
  if (integerDigits.length > MAX_INTEGER_DIGITS) return { ok: false };
  const fraction = (match[2] ?? '').padEnd(FRACTION_DIGITS + 1, '0');
  const roundUp = (fraction.charCodeAt(FRACTION_DIGITS) - 48) >= 5 ? 1 : 0;
  const micros =
    digitsToInt(integerDigits) * MICROS_PER_UNIT + digitsToInt(fraction.slice(0, FRACTION_DIGITS)) + roundUp;
  if (micros < RATE_MIN_MICROS || micros > RATE_MAX_MICROS) return { ok: false };
  return { ok: true, micros };
}
