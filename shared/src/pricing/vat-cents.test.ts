import { describe, expect, it } from 'vitest';
import { vatCentsHalfUp } from './vat-cents';

describe('vatCentsHalfUp (interno, D-P9)', () => {
  it.each([
    [5, 10, 1],
    [4, 10, 0],
    [15, 10, 2],
    [14, 10, 1],
    [50017000, 23, 11503910],
  ])('(%i, %i) → %i', (base, rate, vat) => {
    expect(vatCentsHalfUp(base, rate)).toBe(vat);
  });

  it('(0, 21) → +0', () => {
    expect(Object.is(vatCentsHalfUp(0, 21), 0)).toBe(true);
  });
});
