// Tabla país → divisa (RF13, CA2): total sobre ISO, error tipado para códigos no ISO.
import { describe, expect, it } from 'vitest';
import { CURRENCIES } from '../currency/types';
import { COUNTRY_CURRENCY, COUNTRY_CURRENCY_GROUPS, currencyForCountry } from './country-currency';
import { ISO_3166_ALPHA2, isIsoAlpha2 } from './iso3166-alpha2';

describe('currencyForCountry (RF13)', () => {
  it.each([
    ['ES', 'EUR'], ['PT', 'EUR'], ['FR', 'EUR'], ['DE', 'EUR'], ['IT', 'EUR'], ['BG', 'EUR'],
    ['US', 'USD'], ['PR', 'USD'], ['GB', 'GBP'], ['CH', 'CHF'], ['LI', 'CHF'],
    ['SE', 'SEK'], ['NO', 'NOK'], ['DK', 'DKK'], ['PL', 'PLN'], ['CZ', 'CZK'], ['CA', 'CAD'],
    ['AU', 'AUD'], ['NZ', 'NZD'], ['MX', 'MXN'], ['BR', 'BRL'], ['RO', 'RON'], ['HK', 'HKD'],
    ['SG', 'SGD'], ['CN', 'CNY'], ['IL', 'ILS'], ['ZA', 'ZAR'], ['TR', 'TRY'], ['TH', 'THB'],
    ['AE', 'AED'],
  ])('%s da %s', (code, currency) => {
    expect(currencyForCountry(code)).toEqual({ ok: true, currency });
  });

  it.each([['JP'], ['AR'], ['AQ']])('%s no tiene divisa propia y da EUR', (code) => {
    expect(currencyForCountry(code)).toEqual({ ok: true, currency: 'EUR' });
  });

  it.each([['UK'], ['XX'], ['es'], [''], ['ESP'], ['E1']])('%j no es ISO y da error tipado, no EUR', (code) => {
    expect(currencyForCountry(code)).toEqual({ ok: false });
  });

  it('todo código ISO da una divisa de la lista', () => {
    for (const code of ISO_3166_ALPHA2) {
      const result = currencyForCountry(code);
      expect(result.ok).toBe(true);
      if (result.ok) expect(CURRENCIES).toContain(result.currency);
    }
  });
});

describe('tabla explícita', () => {
  it('cada entrada es ISO válido', () => {
    for (const code of COUNTRY_CURRENCY.keys()) expect(isIsoAlpha2(code)).toBe(true);
  });

  it('no hay códigos duplicados entre grupos', () => {
    const total = Object.values(COUNTRY_CURRENCY_GROUPS).reduce((n, codes) => n + codes.length, 0);
    expect(COUNTRY_CURRENCY.size).toBe(total);
  });

  it('cada divisa de la lista tiene al menos un país', () => {
    for (const currency of CURRENCIES) {
      expect([...COUNTRY_CURRENCY.values()]).toContain(currency);
    }
  });
});
