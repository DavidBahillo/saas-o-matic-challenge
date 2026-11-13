import { MICROS_PER_UNIT } from './types';
import type { RateMicros } from './types';

/** 1_100_000 → "1.100000"; siempre 6 decimales (RF11). Solo aritmética de enteros. */
export function formatRate(micros: RateMicros): string {
  const fraction = micros % MICROS_PER_UNIT;
  const integer = (micros - fraction) / MICROS_PER_UNIT;
  return `${String(integer)}.${String(fraction).padStart(6, '0')}`;
}
