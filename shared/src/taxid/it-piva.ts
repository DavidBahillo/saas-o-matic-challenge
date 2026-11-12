// Partita IVA italiana (RF16, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → solo ceros → código de oficina (dígitos 8 a 10) → control.
import { digitsOf, doubleAndReduce, isAllZeros, isDigits } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

/** Oficinas válidas (Glosario): `001`–`100`, `120`, `121`, `888` y `999`. */
const OFFICE_CODES: ReadonlySet<string> = new Set([
  ...Array.from({ length: 100 }, (_, i) => String(i + 1).padStart(3, '0')),
  '120',
  '121',
  '888',
  '999',
]);

/**
 * X = suma de los dígitos en posiciones impares 1.ª a 9.ª; Y = suma de los dígitos en
 * posiciones pares 2.ª a 10.ª doblados (restando 9 si superan 9). Control = (10 − ((X + Y) mod 10)) mod 10.
 */
function itControlDigit(tenDigits: string): number {
  const sum = digitsOf(tenDigits).reduce(
    (acc, d, i) => acc + (i % 2 === 0 ? d : doubleAndReduce(d)),
    0,
  );
  return (10 - (sum % 10)) % 10;
}

export function validateItPiva(id: string): TaxIdResult {
  if (!isDigits(id, 11)) return formatError();
  if (isAllZeros(id)) return formatError('ALL_ZEROS', 'IT_PIVA');
  if (!OFFICE_CODES.has(id.slice(7, 10))) return formatError('IT_OFFICE_CODE', 'IT_PIVA');
  if (itControlDigit(id.slice(0, 10)) !== Number(id.charAt(10))) return checksumError('IT_PIVA');
  return taxIdOk(id, 'IT_PIVA');
}
