import { describe, expect, it } from 'vitest';
import { validateCurrency } from './validate-currency';

describe('validateCurrency (RF13)', () => {
  it.each([
    [undefined, 'EUR'],
    ['EUR', 'EUR'],
    ['USD', 'USD'],
    ['GBP', 'GBP'],
  ])('%j es válida y da %s', (raw, value) => {
    expect(validateCurrency(raw)).toEqual({ ok: true, value });
  });

  it.each([['usd'], ['Usd'], [' USD '], ['   '], [''], ['USD\n'], ['US'], ['USDD'], ['U$D'], ['123']])(
    '%j da INVALID_CURRENCY',
    (raw) => {
      const r = validateCurrency(raw);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe('INVALID_CURRENCY');
        expect(r.error.field).toBe('currency');
      }
    },
  );

  it.each([[null], [34], [true], [{}], [['USD']]])('%j da INVALID_TYPE', (raw) => {
    const r = validateCurrency(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TYPE');
  });

  it.each([['JPY'], ['CHF'], ['MXN'], ['XXX']])('%s da CURRENCY_NOT_AVAILABLE con suggestion', (raw) => {
    const r = validateCurrency(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('CURRENCY_NOT_AVAILABLE');
      expect(r.error.suggestion).toBe('EUR, USD, GBP');
      expect(r.error.reason).toBeUndefined();
    }
  });
});
