import { describe, expect, it } from 'vitest';
import { parseRateText } from './parse-rate';

describe('parseRateText (RF11, RF12)', () => {
  it.each([
    ['1.1', 1_100_000],
    ['1.1234567', 1_123_457],
    ['0.0099996', 10_000],
    ['0.01', 10_000],
    ['100', 100_000_000],
    ['100.0000004', 100_000_000],
    ['1', 1_000_000],
    ['0.85', 850_000],
    ['1.0000005', 1_000_001],
    ['0.0100000000000000000001', 10_000],
  ])('%s es válido y da %i micro-unidades', (text, micros) => {
    expect(parseRateText(text)).toEqual({ ok: true, micros });
  });

  it.each([
    ['0.0099994'],
    ['100.0000005'],
    ['0'],
    ['-1'],
    ['1e0'],
    ['abc'],
    [''],
    ['NaN'],
    ['+1'],
    ['1.'],
    ['.5'],
    [' 1.1'],
    ['1.1\n'],
    ['99999999999999999999'],
    ['1000'],
  ])('%j es fallo', (text) => {
    expect(parseRateText(text)).toEqual({ ok: false });
  });
});
