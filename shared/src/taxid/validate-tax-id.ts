// Punto de entrada de la validación del identificador fiscal (RF2, RF9, RF10, RF19, RF20).
// Recibe un país ya validado (T6). Orden: normaliza una sola vez → REQUIRED →
// prefijo de país (solo en los 6 países con algoritmo) → validador del país o genérico.
import { validateDeVat } from './de-vat';
import { validateEsTaxId } from './es';
import { validateFrSiren } from './fr-siren';
import { validateGbVat } from './gb-vat';
import { validateGenericTaxId } from './generic';
import { validateItPiva } from './it-piva';
import { normalizeTaxId } from './normalize-tax-id';
import { validatePtNif } from './pt-nif';
import { countryPrefixError } from './result';
import type { TaxIdResult } from './result';

export const TAX_ID_REQUIRED_MESSAGE = 'El identificador fiscal es obligatorio.';

type CountryValidator = (id: string) => TaxIdResult;

const COUNTRY_VALIDATORS: Readonly<Record<string, CountryValidator>> = {
  ES: validateEsTaxId,
  PT: validatePtNif,
  FR: validateFrSiren,
  DE: validateDeVat,
  IT: validateItPiva,
  GB: validateGbVat,
};

/** Valida un tax ID en bruto: lo normaliza una sola vez (RF2) y delega. */
export function validateTaxId(country: string, raw: string): TaxIdResult {
  return validateNormalizedTaxId(country, normalizeTaxId(raw));
}

/**
 * Valida un tax ID ya normalizado sin volver a normalizarlo (T11): normalizar dos veces cambia
 * el resultado (`12345678Z\n-` → `12345678Z\n` → `12345678Z`), y RF2 la aplica una sola vez.
 */
export function validateNormalizedTaxId(country: string, id: string): TaxIdResult {
  if (id === '') {
    return { ok: false, error: { code: 'REQUIRED', message: TAX_ID_REQUIRED_MESSAGE } };
  }
  const validator = Object.hasOwn(COUNTRY_VALIDATORS, country)
    ? COUNTRY_VALIDATORS[country]
    : undefined;
  if (validator === undefined) return validateGenericTaxId(id);
  if (id.startsWith(country)) return countryPrefixError(country);
  return validator(id);
}
