import { describe, expect, it } from 'vitest';
import { calculateQuote } from './calculate-quote';
import type { Quote } from './types';

// [users, country, base, rate, vat, total] en céntimos
const ROWS: ReadonlyArray<readonly [number, string, number, number, number, number]> = [
  [0, 'ES', 0, 21, 0, 0],
  [1, 'ES', 1000, 21, 210, 1210],
  [15, 'ES', 14000, 21, 2940, 16940],
  [51, 'PT', 42500, 23, 9775, 52275],
  [11, 'FR', 10800, 20, 2160, 12960],
  [15, 'DE', 14000, 19, 2660, 16660],
  [100, 'IT', 67000, 22, 14740, 81740],
  [1, 'GB', 1000, 20, 200, 1200],
  [50, 'US', 42000, 0, 0, 42000],
  [10, 'MX', 10000, 0, 0, 10000],
  [100000, 'ES', 50017000, 21, 10503570, 60520570],
  [100000, 'PT', 50017000, 23, 11503910, 61520910],
  [-0, 'US', 0, 0, 0, 0],
];

const QUOTE_15_ES: Quote = {
  users: 15,
  tiers: [
    { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 10, subtotalCents: 10000 },
    { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 5, subtotalCents: 4000 },
    { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
  ],
  baseCents: 14000,
  country: 'ES',
  vatRatePercent: 21,
  vatCents: 2940,
  totalCents: 16940,
};

function numericOutputs(q: Quote): number[] {
  const tierNums = q.tiers.flatMap((t) => [t.billedUsers, t.subtotalCents]);
  return [q.users, q.baseCents, q.vatRatePercent, q.vatCents, q.totalCents, ...tierNums];
}

describe('calculateQuote · IVA por país', () => {
  it.each(ROWS)('%i usuarios %s → base %i, %i %%, IVA %i, total %i', (users, country, base, rate, vat, total) => {
    const result = calculateQuote({ users, country });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { baseCents, vatRatePercent, vatCents, totalCents } = result.value;
    expect([baseCents, vatRatePercent, vatCents, totalCents]).toEqual([base, rate, vat, total]);
    for (const n of numericOutputs(result.value)) expect(Object.is(n, -0)).toBe(false);
  });

  it('15 ES coincide con el JSON de la spec y respeta el orden de claves', () => {
    const result = calculateQuote({ users: 15, country: 'ES' });
    expect(result).toEqual({ ok: true, value: QUOTE_15_ES });
    if (result.ok) expect(Object.keys(result.value)).toEqual(Object.keys(QUOTE_15_ES));
  });

  it('ignora storage, apiCalls y plan (RF5)', () => {
    const extra = calculateQuote({ users: 15, country: 'ES', storage: 999, apiCalls: 1000000, plan: 'enterprise' });
    expect(extra).toEqual(calculateQuote({ users: 15, country: 'ES' }));
  });

  it('devuelve objetos nuevos en cada llamada (RF14)', () => {
    const a = calculateQuote({ users: 51, country: 'PT' });
    const b = calculateQuote({ users: 51, country: 'PT' });
    expect(a).toEqual(b);
    if (a.ok && b.ok) {
      expect(a.value).not.toBe(b.value);
      expect(a.value.tiers).not.toBe(b.value.tiers);
    }
  });
});
