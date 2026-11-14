// R3-3: criterio de ajuste por caracteres de Fira Code (0,6 em), compartido por la barra y la escalera.
import { describe, expect, it } from 'vitest';
import { fitsInWidth, textWidthPx } from './text-fit';

describe('textWidthPx', () => {
  it.each([
    [9, 140, 76],
    [9, 175, 95],
    [8, 120, 58],
    [0, 120, 0],
  ])('%i caracteres a %i décimas de px miden %i px', (chars, tenths, expected) => {
    expect(textWidthPx(chars, tenths)).toBe(expected);
  });
});

describe('fitsInWidth', () => {
  it('es exacto en el límite', () => {
    expect(fitsInWidth(9, 140, 76)).toBe(true);
    expect(fitsInWidth(9, 140, 75)).toBe(false);
  });
});
