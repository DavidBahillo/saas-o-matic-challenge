import { describe, expect, it } from 'vitest';
import { normalizeTaxId } from './normalize-tax-id';

describe('normalizeTaxId (RF2)', () => {
  it.each([
    ['minúsculas a\u2013z', '12345678z', '12345678Z'],
    ['puntos, guion y espacios', ' 12.345.678-z ', '12345678Z'],
    ['espacio y U+2013', '12 345 678\u2013Z', '12345678Z'],
    ['tabulador interno', '12345678\tZ', '12345678Z'],
    ['espacio duro U+00A0 interno', '12345678\u00A0Z', '12345678Z'],
    ['espacio estrecho U+202F interno', '12345678\u202FZ', '12345678Z'],
    ['CRLF final', '12345678Z\r\n', '12345678Z'],
    ['LF y CR en los extremos', '\n\r12345678Z\r\n', '12345678Z'],
    ['U+00A0 y U+202F en los extremos', '\u00A012345678Z\u202F', '12345678Z'],
    ['guion U+2010', '12345678\u2010Z', '12345678Z'],
    ['guion U+2011', '12345678\u2011Z', '12345678Z'],
    ['guion U+2012', '12345678\u2012Z', '12345678Z'],
    ['guion U+2013', '12345678\u2013Z', '12345678Z'],
    ['guion U+2014', '12345678\u2014Z', '12345678Z'],
    ['signo menos U+2212', '12345678\u2212Z', '12345678Z'],
    ['ejemplo del contrato', 'b-1234567-4', 'B12345674'],
    ['solo separadores', '-.-', ''],
    ['vacío', '', ''],
  ])('%s: %j → %j', (_label, input, expected) => {
    expect(normalizeTaxId(input)).toBe(expected);
  });

  it.each([
    ['ß intacta', '12345678ß', '12345678ß'],
    ['ñ intacta (no pasa a Ñ)', '12345678ñ', '12345678ñ'],
    ['Ñ intacta', '12345678Ñ', '12345678Ñ'],
    ['é intacta', 'é123', 'é123'],
    ['guion bajo intacto', '12345678_z', '12345678_Z'],
    ['barra intacta', '12345678/z', '12345678/Z'],
  ])('solo pasa a mayúsculas a\u2013z: %s', (_label, input, expected) => {
    expect(normalizeTaxId(input)).toBe(expected);
  });

  it('no elimina LF ni CR internos (solo se recortan en los extremos)', () => {
    expect(normalizeTaxId('1234\n5678Z')).toBe('1234\n5678Z');
    expect(normalizeTaxId('1234\r5678Z')).toBe('1234\r5678Z');
  });

  it('no elimina otros espacios Unicode como U+2003', () => {
    expect(normalizeTaxId('1234\u20035678Z')).toBe('1234\u20035678Z');
  });
});
