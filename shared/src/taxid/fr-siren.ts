// SIREN francés (RF14, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → solo ceros → Luhn. Francia no tiene regla de primer dígito.
import { digitsOf, doubleAndReduce, isAllZeros, isDigits } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

/** Suma Luhn: se doblan las posiciones pares (2.ª, 4.ª…) contando desde la izquierda. */
function luhnSum(digits: string): number {
  // índice 1 = 2.ª posición (par): se dobla y se resta 9 si supera 9.
  return digitsOf(digits).reduce((acc, d, i) => acc + (i % 2 === 1 ? doubleAndReduce(d) : d), 0);
}

export function validateFrSiren(id: string): TaxIdResult {
  if (!isDigits(id, 9)) return formatError();
  if (isAllZeros(id)) return formatError('ALL_ZEROS', 'FR_SIREN');
  if (luhnSum(id) % 10 !== 0) return checksumError('FR_SIREN');
  return taxIdOk(id, 'FR_SIREN');
}
