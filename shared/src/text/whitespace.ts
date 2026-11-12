// Trim con la definición de "espacio en blanco" del Glosario de la spec 001:
// U+0020, U+0009, U+000A, U+000D, U+00A0 y U+202F. No usa String.prototype.trim,
// que recorta más caracteres (U+2003, U+FEFF…).
const EDGE_WHITESPACE = /^[ \t\n\r\u00A0\u202F]+|[ \t\n\r\u00A0\u202F]+$/g;

export function trimWhitespace(s: string): string {
  return s.replace(EDGE_WHITESPACE, '');
}
