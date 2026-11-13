import { describe, expect, it } from 'vitest';
import { convertQuote } from './convert-quote';

const USD = 1_100_000;
const GBP = 850_000;

describe('convertQuote (RF5-RF7, RF9)', () => {
  it.each([
    [0, 0, USD, 0, 0, 0],
    [1000, 210, USD, 1100, 231, 1331],
    [10_000, 2100, USD, 11_000, 2310, 13_310],
    [10_800, 2268, USD, 11_880, 2495, 14_375],
    [14_000, 2940, USD, 15_400, 3234, 18_634],
    [42_000, 8820, USD, 46_200, 9702, 55_902],
    [42_500, 8925, USD, 46_750, 9818, 56_568],
    [50_017_000, 10_503_570, USD, 55_018_700, 11_553_927, 66_572_627],
    [50_017_000, 11_503_910, USD, 55_018_700, 12_654_301, 67_673_001],
    [14_000, 0, USD, 15_400, 0, 15_400],
    [10_800, 2484, GBP, 9180, 2111, 11_291],
  ])('base %i e IVA %i con %i dan %i / %i / %i', (b, v, rate, cb, cv, ct) => {
    expect(convertQuote({ baseCents: b, vatCents: v }, rate)).toEqual({
      convertedBaseCents: cb,
      convertedVatCents: cv,
      convertedTotalCents: ct,
    });
  });

  it('el total es la suma de los convertidos, no la conversión del total (1,0035)', () => {
    const r = convertQuote({ baseCents: 1000, vatCents: 210 }, 1_003_500);
    expect(r).toEqual({ convertedBaseCents: 1004, convertedVatCents: 211, convertedTotalCents: 1215 });
  });

  it('el IVA convertido es la conversión del IVA, no el 21 % de la base convertida (1,0024)', () => {
    const r = convertQuote({ baseCents: 1000, vatCents: 210 }, 1_002_400);
    expect(r.convertedVatCents).toBe(211);
    expect(r.convertedTotalCents).toBe(1213);
  });

  it('todas las salidas son enteros seguros, no negativos y sin -0', () => {
    const r = convertQuote({ baseCents: 0, vatCents: 0 }, 400_000);
    for (const v of Object.values(r)) {
      expect(Number.isSafeInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Object.is(v, -0)).toBe(false);
    }
  });
});
