// Validador genérico para los países sin algoritmo (RF20). La entrada llega normalizada y
// no vacía. Orden: caracteres fuera de A–Z y 0–9 → FORMAT; longitud fuera de 2–20 → INVALID_LENGTH.
// La regla de ceros no se aplica.
import { formatError, taxIdOk } from './result';
import type { TaxIdResult } from './result';

export const GENERIC_TAX_ID_MIN_LENGTH = 2;
export const GENERIC_TAX_ID_MAX_LENGTH = 20;

export const GENERIC_TAX_ID_LENGTH_MESSAGE =
  'El identificador fiscal debe tener entre 2 y 20 caracteres.';

const ALLOWED = /^[A-Z0-9]*$/;

export function validateGenericTaxId(id: string): TaxIdResult {
  if (!ALLOWED.test(id)) return formatError();
  if (id.length < GENERIC_TAX_ID_MIN_LENGTH || id.length > GENERIC_TAX_ID_MAX_LENGTH) {
    return { ok: false, error: { code: 'INVALID_LENGTH', message: GENERIC_TAX_ID_LENGTH_MESSAGE } };
  }
  return taxIdOk(id, 'OTHER');
}
