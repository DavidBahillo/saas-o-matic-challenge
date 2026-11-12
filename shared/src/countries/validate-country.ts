// Validación del país (RF2, RF3, RF6): trim con la definición del Glosario, mayúsculas solo
// en a–z y pertenencia a la lista ISO 3166-1 alfa-2. UK no es un alias: se rechaza con la
// sugerencia GB.
import { fail, ok, readText } from '../customers/field-result';
import type { FieldResult } from '../customers/field-result';
import { trimWhitespace } from '../text/whitespace';
import { isIsoAlpha2 } from './iso3166-alpha2';

export const COUNTRY_MESSAGES = {
  REQUIRED: 'El país es obligatorio.',
  INVALID_TYPE: 'El país debe ser un texto.',
  INVALID_COUNTRY: 'El país debe ser un código ISO 3166-1 alfa-2 válido.',
  UK_SUGGESTION: '¿Querías decir GB?',
} as const;

const FIELD = 'country';

function normalizeCountry(raw: string): string {
  return trimWhitespace(raw).replace(/[a-z]/g, (c) => c.toUpperCase());
}

export function validateCountry(raw: unknown): FieldResult<string> {
  const text = readText(
    FIELD,
    raw,
    { required: COUNTRY_MESSAGES.REQUIRED, invalidType: COUNTRY_MESSAGES.INVALID_TYPE },
    normalizeCountry,
  );
  if (!text.ok) return text;
  const code = text.value;
  if (code === 'UK') {
    return fail(FIELD, 'INVALID_COUNTRY', COUNTRY_MESSAGES.UK_SUGGESTION, { suggestion: 'GB' });
  }
  if (!isIsoAlpha2(code)) return fail(FIELD, 'INVALID_COUNTRY', COUNTRY_MESSAGES.INVALID_COUNTRY);
  return ok(code);
}
