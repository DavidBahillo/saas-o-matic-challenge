import { describe, expect, it } from 'vitest';
import { digitsOf, doubleAndReduce, isAllZeros, isDigits } from './digits';

describe('isDigits', () => {
  it.each([
    ['123456789', 9, true],
    ['12345678', 9, false],
    ['1234567890', 9, false],
    ['12345678A', 9, false],
    ['', 0, true],
    ['\u0661\u0662\u0663', 3, false],
  ])('%j con longitud %i → %s', (input, length, expected) => {
    expect(isDigits(input, length)).toBe(expected);
  });
});

describe('isAllZeros', () => {
  it.each([
    ['000000000', true],
    ['0', true],
    ['000000001', false],
    ['', false],
    ['00A', false],
  ])('%j → %s', (input, expected) => {
    expect(isAllZeros(input)).toBe(expected);
  });
});

describe('digitsOf', () => {
  it('convierte una cadena de dígitos en números', () => {
    expect(digitsOf('5019')).toEqual([5, 0, 1, 9]);
    expect(digitsOf('')).toEqual([]);
  });
});

describe('doubleAndReduce', () => {
  it.each([
    [0, 0], [1, 2], [4, 8], [5, 1], [6, 3], [7, 5], [8, 7], [9, 9],
  ])('%i → %i', (input, expected) => {
    expect(doubleAndReduce(input)).toBe(expected);
  });
});
