// Nombre de empresa (RF2, RF3, RF4): NFC y trim; los caracteres de control tienen precedencia
// sobre la longitud, que se mide en code points (2–120).
import { codePointLength, hasControlChars } from '../text/code-points';
import { trimWhitespace } from '../text/whitespace';
import { fail, ok, readText } from './field-result';
import type { FieldResult } from './field-result';

export const COMPANY_NAME_MIN_LENGTH = 2;
export const COMPANY_NAME_MAX_LENGTH = 120;

export const COMPANY_NAME_MESSAGES = {
  REQUIRED: 'El nombre de la empresa es obligatorio.',
  INVALID_TYPE: 'El nombre de la empresa debe ser un texto.',
  INVALID_LENGTH: 'El nombre de la empresa debe tener entre 2 y 120 caracteres.',
  INVALID_CHARACTERS: 'El nombre de la empresa no puede contener caracteres de control.',
} as const;

const FIELD = 'companyName';

function normalizeCompanyName(raw: string): string {
  return trimWhitespace(raw.normalize('NFC'));
}

export function validateCompanyName(raw: unknown): FieldResult<string> {
  const text = readText(
    FIELD,
    raw,
    { required: COMPANY_NAME_MESSAGES.REQUIRED, invalidType: COMPANY_NAME_MESSAGES.INVALID_TYPE },
    normalizeCompanyName,
  );
  if (!text.ok) return text;
  const name = text.value;
  if (hasControlChars(name)) {
    return fail(FIELD, 'INVALID_CHARACTERS', COMPANY_NAME_MESSAGES.INVALID_CHARACTERS);
  }
  const length = codePointLength(name);
  if (length < COMPANY_NAME_MIN_LENGTH || length > COMPANY_NAME_MAX_LENGTH) {
    return fail(FIELD, 'INVALID_LENGTH', COMPANY_NAME_MESSAGES.INVALID_LENGTH);
  }
  return ok(name);
}
