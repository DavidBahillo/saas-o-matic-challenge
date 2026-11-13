import { describe, expect, it } from 'vitest';
import { formatRateFull, formatRateShort } from './format-rate-text';

describe('formatRateFull', () => {
  it('cambia el punto por coma y conserva los 6 decimales', () => {
    expect(formatRateFull('1.100000')).toBe('1,100000');
    expect(formatRateFull('1.000000')).toBe('1,000000');
  });
});

describe('formatRateShort', () => {
  it.each([
    ['1.100000', '1,10'],
    ['0.850000', '0,85'],
    ['1.123400', '1,1234'],
    ['2.000000', '2,00'],
    ['1.000001', '1,000001'],
  ])('%s → %s', (text, expected) => {
    expect(formatRateShort(text)).toBe(expected);
  });
});
