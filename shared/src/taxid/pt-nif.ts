// NIF/NIPC portugués (RF13, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → solo ceros → primer dígito distinto de 0 → control módulo 11.
import { digitsOf, isAllZeros, isDigits } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

const WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Control = 11 − (S mod 11); si sale 10 u 11, el control es 0 (Glosario: NIF/NIPC). */
function ptControlDigit(eightDigits: string): number {
  const sum = digitsOf(eightDigits).reduce((acc, d, i) => acc + d * (WEIGHTS[i] ?? 0), 0);
  const control = 11 - (sum % 11);
  return control >= 10 ? 0 : control;
}

export function validatePtNif(id: string): TaxIdResult {
  if (!isDigits(id, 9)) return formatError();
  if (isAllZeros(id)) return formatError('ALL_ZEROS', 'PT_NIF');
  if (id.startsWith('0')) return formatError('FIRST_DIGIT', 'PT_NIF');
  if (ptControlDigit(id.slice(0, 8)) !== Number(id.charAt(8))) return checksumError('PT_NIF');
  return taxIdOk(id, 'PT_NIF');
}
