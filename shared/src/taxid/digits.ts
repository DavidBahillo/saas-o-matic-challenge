// Utilidades de dígitos para los algoritmos de control (RF11–RF18). Solo dígitos ASCII 0–9.

/** `true` si `s` tiene exactamente `length` dígitos ASCII. */
export function isDigits(s: string, length: number): boolean {
  return s.length === length && /^[0-9]*$/.test(s);
}

/** `true` si `digits` no está vacío y solo contiene el carácter `0` (RF18). */
export function isAllZeros(digits: string): boolean {
  return /^0+$/.test(digits);
}

/** Convierte una cadena de dígitos ASCII en sus valores numéricos. */
export function digitsOf(s: string): number[] {
  return Array.from(s, (ch) => ch.charCodeAt(0) - 48);
}

/** Dobla un dígito y resta 9 si el resultado supera 9 (Luhn, CIF, Partita IVA). */
export function doubleAndReduce(d: number): number {
  const doubled = d * 2;
  return doubled > 9 ? doubled - 9 : doubled;
}
