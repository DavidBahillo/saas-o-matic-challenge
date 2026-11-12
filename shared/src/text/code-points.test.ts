import { describe, expect, it } from 'vitest';
import { codePointLength, hasControlChars } from './code-points';

describe('codePointLength', () => {
  it.each([
    ['', 0],
    ['A', 1],
    ['Acme', 4],
    ['é', 1],
    ['e\u0301', 2],
    ['😀', 1],
    ['Acme 😀', 6],
    ['𝔸𝔹', 2],
  ])('%j tiene %i code points', (input, expected) => {
    expect(codePointLength(input)).toBe(expected);
  });
});

describe('hasControlChars', () => {
  it.each([
    ['U+0000', '\u0000'],
    ['tabulador U+0009', 'Acme\tIbérica'],
    ['salto de línea U+000A', 'Acme\nIbérica'],
    ['retorno U+000D', 'Acme\rIbérica'],
    ['U+001F', 'a\u001Fb'],
    ['DEL U+007F', 'a\u007Fb'],
    ['U+0080', 'a\u0080b'],
    ['U+009F', 'a\u009Fb'],
  ])('detecta %s', (_label, input) => {
    expect(hasControlChars(input)).toBe(true);
  });

  it.each([
    ['texto normal', 'Acme Ibérica SL'],
    ['espacio U+0020', ' '],
    ['U+00A0 (justo después del rango)', 'a\u00A0b'],
    ['espacio estrecho U+202F', 'a\u202Fb'],
    ['emoji', 'Acme 😀'],
    ['vacío', ''],
  ])('no marca %s', (_label, input) => {
    expect(hasControlChars(input)).toBe(false);
  });
});
