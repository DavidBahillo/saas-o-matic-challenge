// DNI y NIE españoles (RF11, RF12, RF18). La entrada llega normalizada y sin prefijo.
// Orden (RF10): forma → parte numérica solo de ceros → letra de control.
import type { TaxIdType } from '../customers/types';
import { isAllZeros } from './digits';
import { checksumError, formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

const CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const DNI_SHAPE = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
const NIE_SHAPE = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
const NIE_PREFIX_DIGIT: Readonly<Record<string, string>> = { X: '0', Y: '1', Z: '2' };

/** Letra de control de un número de 8 cifras (Glosario: DNI). */
function controlLetter(eightDigits: string): string {
  return CONTROL_LETTERS.charAt(Number(eightDigits) % 23);
}

/** Valida la parte numérica y la letra de control ya con la forma comprobada. */
function check(id: string, numericPart: string, number: string, type: TaxIdType): TaxIdResult {
  if (isAllZeros(numericPart)) return formatError('ALL_ZEROS', type);
  if (controlLetter(number) !== id.charAt(id.length - 1)) return checksumError(type);
  return taxIdOk(id, type);
}

export function validateDniNie(id: string): TaxIdResult {
  if (DNI_SHAPE.test(id)) {
    const digits = id.slice(0, 8);
    return check(id, digits, digits, 'DNI');
  }
  if (NIE_SHAPE.test(id)) {
    const digits = id.slice(1, 8);
    const number = (NIE_PREFIX_DIGIT[id.charAt(0)] ?? '') + digits;
    return check(id, digits, number, 'NIE');
  }
  return formatError();
}
