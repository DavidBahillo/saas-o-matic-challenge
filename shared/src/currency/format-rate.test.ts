import { describe, expect, it } from 'vitest';
import { formatRate } from './format-rate';

describe('formatRate (RF11)', () => {
  it.each([
    [1_100_000, '1.100000'],
    [1_000_000, '1.000000'],
    [850_000, '0.850000'],
    [10_000, '0.010000'],
    [100_000_000, '100.000000'],
    [1_123_457, '1.123457'],
  ])('%i es %s', (micros, text) => {
    expect(formatRate(micros)).toBe(text);
  });
});
