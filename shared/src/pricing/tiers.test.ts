import { describe, expect, it } from 'vitest';
import { MAX_USERS, PRICING_TIERS } from './tiers';
import { computeTierBreakdown, sumSubtotals } from './tier-breakdown';

describe('PRICING_TIERS', () => {
  it('define los tres tramos literales', () => {
    expect(PRICING_TIERS).toEqual([
      { tier: 1, from: 1, to: 10, unitPriceCents: 1000 },
      { tier: 2, from: 11, to: 50, unitPriceCents: 800 },
      { tier: 3, from: 51, to: null, unitPriceCents: 500 },
    ]);
    expect(MAX_USERS).toBe(100000);
  });

  it('está congelado, también cada tramo', () => {
    expect(Object.isFrozen(PRICING_TIERS)).toBe(true);
    for (const tier of PRICING_TIERS) expect(Object.isFrozen(tier)).toBe(true);
  });

  it('modificarlo lanza TypeError y no cambia el cálculo', () => {
    expect(() => {
      // @ts-expect-error unitPriceCents es readonly
      PRICING_TIERS[0].unitPriceCents = 1;
    }).toThrow(TypeError);
    expect(() => {
      // @ts-expect-error to es readonly
      PRICING_TIERS[1].to = 999;
    }).toThrow(TypeError);
    expect(() => {
      // El tipo readonly no expone push; se invoca el de Array.prototype para probar el freeze.
      Array.prototype.push.call(PRICING_TIERS, { tier: 3, from: 1, to: null, unitPriceCents: 1 });
    }).toThrow(TypeError);
    expect(sumSubtotals(computeTierBreakdown(15))).toBe(14000);
  });
});
