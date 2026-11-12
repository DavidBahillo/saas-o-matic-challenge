import { describe, expect, it } from 'vitest';
import { computeTierBreakdown, sumSubtotals } from './tier-breakdown';

// Oráculo literal: [N, billed1, billed2, billed3, base]
const ROWS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 0, 0, 0],
  [1, 1, 0, 0, 1000],
  [9, 9, 0, 0, 9000],
  [10, 10, 0, 0, 10000],
  [11, 10, 1, 0, 10800], // no acumulativo daría 8800
  [15, 10, 5, 0, 14000],
  [49, 10, 39, 0, 41200],
  [50, 10, 40, 0, 42000],
  [51, 10, 40, 1, 42500], // no acumulativo daría 25500
  [52, 10, 40, 2, 43000],
  [100, 10, 40, 50, 67000],
  [1000, 10, 40, 950, 517000],
  [100000, 10, 40, 99950, 50017000],
];

describe('computeTierBreakdown', () => {
  it.each(ROWS)('%i usuarios → %i/%i/%i, base %i', (n, b1, b2, b3, base) => {
    const lines = computeTierBreakdown(n);
    expect(lines.map((l) => l.billedUsers)).toEqual([b1, b2, b3]);
    expect(lines.map((l) => l.subtotalCents)).toEqual([b1 * 1000, b2 * 800, b3 * 500]);
    expect(sumSubtotals(lines)).toBe(base);
  });

  it('siempre devuelve 3 líneas en orden con from/to de la definición', () => {
    expect(computeTierBreakdown(0)).toEqual([
      { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 0, subtotalCents: 0 },
      { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 0, subtotalCents: 0 },
      { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
    ]);
  });

  it('devuelve +0, nunca -0, con cero usuarios', () => {
    for (const line of computeTierBreakdown(0)) {
      expect(Object.is(line.billedUsers, -0)).toBe(false);
      expect(Object.is(line.subtotalCents, -0)).toBe(false);
    }
  });
});
