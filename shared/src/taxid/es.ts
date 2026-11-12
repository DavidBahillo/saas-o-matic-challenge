// Clasificador español (RF12): primer carácter dígito → DNI; X/Y/Z → NIE; letra de tipo
// de CIF → CIF; cualquier otro → FORMAT. La entrada llega normalizada y sin prefijo.
import { validateCif } from './es-cif';
import { validateDniNie } from './es-dni-nie';
import { formatError } from './result';
import type { TaxIdResult } from './result';

const DNI_NIE_START = /^[0-9XYZ]/;
const CIF_START = /^[ABCDEFGHJNPQRSUVW]/;

export function validateEsTaxId(id: string): TaxIdResult {
  if (DNI_NIE_START.test(id)) return validateDniNie(id);
  if (CIF_START.test(id)) return validateCif(id);
  return formatError();
}
