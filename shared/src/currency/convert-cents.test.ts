import { describe, expect, it } from 'vitest';
import { convertCents } from './convert-cents';

describe('convertCents (RF5, RF9, RF10)', () => {
  it.each([
    [5, 1_100_000, 6],
    [10, 850_000, 9],
    [1, 850_000, 1],
    [1, 400_000, 0],
    [0, 1_100_000, 0],
    [2268, 1_100_000, 2495],
    [8925, 1_100_000, 9818],
    [1000, 1_003_500, 1004],
    [210, 1_003_500, 211],
    [1000, 1_002_400, 1002],
    [210, 1_002_400, 211],
    [14_000, 1_100_000, 15_400],
    [2940, 1_100_000, 3234],
    [50_017_000, 1_100_000, 55_018_700],
    [12, 1_000_000, 12],
  ])('%i céntimos con %i micro-unidades dan %i', (cents, micros, expected) => {
    const out = convertCents(cents, micros);
    expect(out).toBe(expected);
    expect(Object.is(out, -0)).toBe(false);
  });

  it('devuelve +0 con importe 0', () => {
    expect(Object.is(convertCents(0, 400_000), 0)).toBe(true);
  });
});
