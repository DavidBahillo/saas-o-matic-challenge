// CIF español (RF11, RF12, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → parte numérica solo de ceros → carácter de control. El tipo de
// control (dígito, letra o ambos) se comprueba en el paso de control: un dígito donde el
// tipo exige letra, o al revés, es CHECKSUM (plan §5).
import { digitsOf, doubleAndReduce, isAllZeros } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

const CIF_SHAPE = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9JABCDEFGHI]$/;
const CONTROL_LETTERS = 'JABCDEFGHI';
const DIGIT_ONLY_TYPES = 'ABEH';
const LETTER_ONLY_TYPES = 'NPQRSW';

/** D = (10 − ((A + B) mod 10)) mod 10 sobre los 7 dígitos centrales (Glosario: CIF). */
function cifControlDigit(sevenDigits: string): number {
  const sum = digitsOf(sevenDigits).reduce(
    // índice 0 = 1.ª posición (impar): se dobla; índice 1 = 2.ª (par): se suma tal cual.
    (acc, d, i) => acc + (i % 2 === 0 ? doubleAndReduce(d) : d),
    0,
  );
  return (10 - (sum % 10)) % 10;
}

function controlMatches(entityType: string, control: string, d: number): boolean {
  const asDigit = control === String(d);
  const asLetter = control === CONTROL_LETTERS.charAt(d);
  if (DIGIT_ONLY_TYPES.includes(entityType)) return asDigit;
  if (LETTER_ONLY_TYPES.includes(entityType)) return asLetter;
  return asDigit || asLetter;
}

export function validateCif(id: string): TaxIdResult {
  if (!CIF_SHAPE.test(id)) return formatError();
  const digits = id.slice(1, 8);
  if (isAllZeros(digits)) return formatError('ALL_ZEROS', 'CIF');
  const d = cifControlDigit(digits);
  if (!controlMatches(id.charAt(0), id.charAt(8), d)) return checksumError('CIF');
  return taxIdOk(id, 'CIF');
}
