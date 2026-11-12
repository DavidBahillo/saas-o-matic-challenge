// Longitud en code points y detección de caracteres de control (RF4, RF5, RF24).

/** Número de code points (un emoji fuera del BMP cuenta como 1). */
export function codePointLength(s: string): number {
  return Array.from(s).length;
}

function isControlCodePoint(cp: number): boolean {
  return cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f);
}

/** `true` si contiene algún carácter de control U+0000–U+001F o U+007F–U+009F. */
export function hasControlChars(s: string): boolean {
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && isControlCodePoint(cp)) return true;
  }
  return false;
}
