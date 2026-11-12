// País estricto para el IVA (RF9, U3): sin trim ni mayúsculas; reutiliza la lista y la sugerencia de la 001.
import { readText } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';
import { COUNTRY_MESSAGES, checkCountryCode } from '../countries/validate-country';

const MESSAGES = { required: COUNTRY_MESSAGES.REQUIRED, invalidType: COUNTRY_MESSAGES.INVALID_TYPE };

export function validateVatCountry(raw: unknown): FieldResult<string> {
  const text = readText('country', raw, MESSAGES, (s) => s);
  return text.ok ? checkCountryCode(text.value) : text;
}
