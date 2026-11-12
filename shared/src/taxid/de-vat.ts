// Parte numérica del USt-IdNr alemán (RF15, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → solo ceros → primer dígito distinto de 0 → control ISO 7064 MOD 11,10.
import { digitsOf, isAllZeros, isDigits } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

/**
 * ISO 7064 MOD 11,10 (Glosario): P = 10; por dígito, s = (d + P) mod 10 (0 → 10) y
 * P = (2 · s) mod 11. Control = 11 − P; si sale 10, el control es 0.
 */
function deControlDigit(eightDigits: string): number {
  const p = digitsOf(eightDigits).reduce((prev, d) => {
    const s = (d + prev) % 10 || 10;
    return (2 * s) % 11;
  }, 10);
  const control = 11 - p;
  return control === 10 ? 0 : control;
}

export function validateDeVat(id: string): TaxIdResult {
  if (!isDigits(id, 9)) return formatError();
  if (isAllZeros(id)) return formatError('ALL_ZEROS', 'DE_VAT');
  if (id.startsWith('0')) return formatError('FIRST_DIGIT', 'DE_VAT');
  if (deControlDigit(id.slice(0, 8)) !== Number(id.charAt(8))) return checksumError('DE_VAT');
  return taxIdOk(id, 'DE_VAT');
}
