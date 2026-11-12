// Email (RF2, RF3, RF5): trim y minúsculas. Primero la longitud (máximo 254 code points) y
// después el formato: una sola @, parte local no vacía, dominio con al menos dos etiquetas no
// vacías, sin espacios y solo ASCII. No se comprueba que exista (S3).
import { codePointLength } from '../text/code-points';
import { trimWhitespace } from '../text/whitespace';
import { fail, ok, readText } from './field-result';
import type { FieldResult } from './field-result';

export const EMAIL_MAX_LENGTH = 254;

export const EMAIL_MESSAGES = {
  REQUIRED: 'El email es obligatorio.',
  INVALID_TYPE: 'El email debe ser un texto.',
  INVALID_LENGTH: 'El email no puede superar los 254 caracteres.',
  INVALID_EMAIL: 'El email no tiene un formato válido.',
} as const;

const FIELD = 'email';

/** ASCII imprimible sin espacio (U+0021–U+007E): excluye espacios, controles y no ASCII. */
const PRINTABLE_ASCII = /^[!-~]+$/;

/**
 * Minúsculas solo en A–Z: como el email válido es ASCII, equivale a `toLowerCase()` salvo en
 * casos como el signo Kelvin (U+212A), que `toLowerCase()` convertiría en una `k` ASCII y
 * colaría un carácter no ASCII de la entrada.
 */
function normalizeEmail(raw: string): string {
  return trimWhitespace(raw).replace(/[A-Z]/g, (c) => c.toLowerCase());
}

function hasValidFormat(email: string): boolean {
  if (!PRINTABLE_ASCII.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local = '', domain = ''] = parts;
  const labels = domain.split('.');
  return local !== '' && labels.length >= 2 && labels.every((label) => label !== '');
}

export function validateEmail(raw: unknown): FieldResult<string> {
  const text = readText(
    FIELD,
    raw,
    { required: EMAIL_MESSAGES.REQUIRED, invalidType: EMAIL_MESSAGES.INVALID_TYPE },
    normalizeEmail,
  );
  if (!text.ok) return text;
  const email = text.value;
  if (codePointLength(email) > EMAIL_MAX_LENGTH) {
    return fail(FIELD, 'INVALID_LENGTH', EMAIL_MESSAGES.INVALID_LENGTH);
  }
  if (!hasValidFormat(email)) return fail(FIELD, 'INVALID_EMAIL', EMAIL_MESSAGES.INVALID_EMAIL);
  return ok(email);
}
