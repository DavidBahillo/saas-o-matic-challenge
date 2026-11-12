// Normalización del identificador fiscal (RF2):
// 1. trim con la definición de espacio en blanco del Glosario (incluye U+000A y U+000D);
// 2. se eliminan en cualquier posición U+0020, U+0009, U+00A0, U+202F, los guiones
//    U+002D, U+2010–U+2014 y U+2212, y el punto U+002E;
// 3. se pasan a mayúsculas solo las letras a–z. Nada más: ß, ñ y demás se quedan igual.
import { trimWhitespace } from '../text/whitespace';

const REMOVABLE = /[ \t\u00A0\u202F\-\u2010-\u2014\u2212.]/g;
const ASCII_LOWER = /[a-z]/g;

export function normalizeTaxId(raw: string): string {
  return trimWhitespace(raw)
    .replace(REMOVABLE, '')
    .replace(ASCII_LOWER, (ch) => ch.toUpperCase());
}
