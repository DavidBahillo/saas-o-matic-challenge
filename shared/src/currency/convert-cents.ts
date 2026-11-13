import { MICROS_PER_UNIT } from './types';
import type { RateMicros } from './types';

const HALF_UNIT = MICROS_PER_UNIT / 2;

/**
 * round_half_up(cents × micros / 1e6) solo con enteros (RF5, RF10). Válida con importes no
 * negativos (la 002 lo garantiza). El numerador menos su resto es múltiplo exacto de 1e6, así que
 * la división final es exacta y el resultado nunca es -0.
 */
export function convertCents(cents: number, micros: RateMicros): number {
  const shifted = cents * micros + HALF_UNIT;
  return (shifted - (shifted % MICROS_PER_UNIT)) / MICROS_PER_UNIT;
}
