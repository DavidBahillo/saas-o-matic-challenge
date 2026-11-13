import { describe, expect, it, vi } from 'vitest';
import { SEED_RATE_AT, createSeedRates } from './seed-rates';

describe('createSeedRates', () => {
  it('USD 1,10 y GBP 0,85 con fecha fija', async () => {
    const rates = createSeedRates();
    const usd = await rates.getRate('USD');
    const gbp = await rates.getRate('GBP');
    expect(usd.micros).toBe(1_100_000);
    expect(gbp.micros).toBe(850_000);
    expect(usd.at.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(SEED_RATE_AT).toBe('2026-01-01T00:00:00.000Z');
  });

  it('getAll devuelve USD y GBP en texto', async () => {
    expect(await createSeedRates().getAll()).toEqual([
      { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: SEED_RATE_AT },
      { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: SEED_RATE_AT },
    ]);
  });

  it('no usa la red', async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error('red');
    });
    vi.stubGlobal('fetch', fetchSpy);
    try {
      await createSeedRates().getRate('USD');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
