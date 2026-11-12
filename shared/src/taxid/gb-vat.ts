// VAT británico de 9 dígitos (RF17, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → solo ceros → control (módulo 97 o variante 9755).
import { digitsOf, isAllZeros, isDigits } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;
const VARIANT_9755_OFFSET = 55;

/**
 * S = suma de los 7 primeros dígitos por los pesos 8…2; C = los 2 últimos dígitos.
 * Válido si (S + C) mod 97 = 0 o (S + 55 + C) mod 97 = 0 (Glosario: VAT GB).
 */
function gbChecksumMatches(nineDigits: string): boolean {
  const sum = digitsOf(nineDigits.slice(0, 7)).reduce(
    (acc, d, i) => acc + d * (WEIGHTS[i] ?? 0),
    0,
  );
  const check = Number(nineDigits.slice(7));
  return (sum + check) % 97 === 0 || (sum + VARIANT_9755_OFFSET + check) % 97 === 0;
}

export function validateGbVat(id: string): TaxIdResult {
  if (!isDigits(id, 9)) return formatError();
  if (isAllZeros(id)) return formatError('ALL_ZEROS', 'GB_VAT');
  if (!gbChecksumMatches(id)) return checksumError('GB_VAT');
  return taxIdOk(id, 'GB_VAT');
}
