// País → divisa (RF13 de la 007): tabla fija y función pura total sobre ISO 3166-1 alfa-2.
import type { Currency } from '../currency/types';
import { isIsoAlpha2 } from './iso3166-alpha2';

export type CountryCurrencyResult = { ok: true; currency: Currency } | { ok: false };

const split = (codes: string): readonly string[] => codes.split(' ');

/** Países por divisa. Todo país ISO que no figure aquí (o cuya divisa no esté en la lista) usa EUR. */
export const COUNTRY_CURRENCY_GROUPS: Readonly<Partial<Record<Currency, readonly string[]>>> = {
  EUR: split(
    'AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK AD MC SM VA ME',
  ),
  USD: split('US PR GU VI AS MP UM EC SV PA TL FM MH PW'),
  GBP: split('GB GG JE IM'),
  CHF: split('CH LI'),
  SEK: ['SE'],
  NOK: split('NO SJ BV'),
  DKK: split('DK GL FO'),
  PLN: ['PL'],
  CZK: ['CZ'],
  CAD: ['CA'],
  AUD: split('AU CX CC NF HM KI NR TV'),
  NZD: split('NZ CK NU TK PN'),
  MXN: ['MX'],
  BRL: ['BR'],
  RON: ['RO'],
  HKD: ['HK'],
  SGD: ['SG'],
  CNY: ['CN'],
  ILS: ['IL'],
  ZAR: ['ZA'],
  TRY: ['TR'],
  THB: ['TH'],
  AED: ['AE'],
};

function buildTable(): ReadonlyMap<string, Currency> {
  const table = new Map<string, Currency>();
  for (const [currency, codes] of Object.entries(COUNTRY_CURRENCY_GROUPS)) {
    for (const code of codes) table.set(code, currency as Currency);
  }
  return table;
}

/** Tabla explícita código → divisa, sin EUR por defecto. */
export const COUNTRY_CURRENCY: ReadonlyMap<string, Currency> = buildTable();

/** ISO sin entrada → EUR ("sin divisa propia"); no ISO → `{ ok: false }` (nunca EUR, como D5). */
export function currencyForCountry(code: string): CountryCurrencyResult {
  if (!isIsoAlpha2(code)) return { ok: false };
  return { ok: true, currency: COUNTRY_CURRENCY.get(code) ?? 'EUR' };
}
