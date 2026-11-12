import { describe, expect, it } from 'vitest';
import { trimWhitespace } from './whitespace';

describe('trimWhitespace (definición del Glosario)', () => {
  it.each([
    ['espacio U+0020', '  Acme  ', 'Acme'],
    ['tabulador U+0009', '\tAcme\t', 'Acme'],
    ['salto de línea U+000A', '\nAcme\n', 'Acme'],
    ['retorno U+000D y CRLF', '\r\nAcme\r\n', 'Acme'],
    ['espacio duro U+00A0', '\u00A0Acme\u00A0', 'Acme'],
    ['espacio estrecho U+202F', '\u202FAcme\u202F', 'Acme'],
    ['mezcla de todos', ' \t\n\r\u00A0\u202FAcme \t\n\r\u00A0\u202F', 'Acme'],
  ])('recorta %s en los extremos', (_label, input, expected) => {
    expect(trimWhitespace(input)).toBe(expected);
  });

  it('conserva los espacios internos', () => {
    expect(trimWhitespace('  Acme \u00A0Ibérica\tSL  ')).toBe('Acme \u00A0Ibérica\tSL');
  });

  it.each([
    ['em space U+2003', '\u2003Acme\u2003'],
    ['BOM U+FEFF', '\uFEFFAcme\uFEFF'],
    ['tabulador vertical U+000B', '\u000BAcme\u000B'],
  ])('no recorta %s, que no está en el Glosario', (_label, input) => {
    expect(trimWhitespace(input)).toBe(input);
  });

  it('devuelve vacío si solo hay espacio en blanco', () => {
    expect(trimWhitespace(' \t\r\n\u00A0\u202F')).toBe('');
    expect(trimWhitespace('')).toBe('');
  });
});
