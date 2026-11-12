import { describe, expect, it } from 'vitest';
import { VAT_RATES_PERCENT, vatRatePercentFor } from './vat-rates';

describe('VAT_RATES_PERCENT', () => {
  it('define los 7 tipos de D5', () => {
    expect(VAT_RATES_PERCENT).toEqual({ ES: 21, PT: 23, FR: 20, DE: 19, IT: 22, GB: 20, US: 0 });
  });

  it.each([
    ['ES', 21], ['PT', 23], ['FR', 20], ['DE', 19], ['IT', 22], ['GB', 20], ['US', 0], ['MX', 0],
  ] as const)('vatRatePercentFor(%s) → %i (RF8)', (country, rate) => {
    expect(vatRatePercentFor(country)).toBe(rate);
  });

  it('no lee claves del prototipo', () => {
    expect(vatRatePercentFor('toString')).toBe(0);
    expect(vatRatePercentFor('__proto__')).toBe(0);
  });

  it('está congelada y asignar ES lanza TypeError (RF4)', () => {
    expect(Object.isFrozen(VAT_RATES_PERCENT)).toBe(true);
    expect(() => {
      // @ts-expect-error ES es readonly
      VAT_RATES_PERCENT.ES = 0;
    }).toThrow(TypeError);
    expect(vatRatePercentFor('ES')).toBe(21);
  });
});
