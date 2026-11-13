// Tipos de cambio fijos del seed (U5, D-P1): sin red y con fecha fija. No se usa la caché de 24 h del
// servicio real porque descartaría estos tipos y pondría la fecha actual en `exchangeRateAt`.
import { formatRate, parseRateText } from '@saas-o-matic/shared';
import type { ForeignCurrency } from '@saas-o-matic/shared';
import type { ExchangeRatesService, RateItem, RatePair } from '../services/exchange-rates.service';

/** Instante fijo con el que se congelan las simulaciones en USD y GBP. */
export const SEED_RATE_AT = '2026-01-01T00:00:00.000Z';

/** 1 EUR = 1,10 USD y 1 EUR = 0,85 GBP. */
export const SEED_RATE_TEXTS: Readonly<Record<'USD' | 'GBP', string>> = {
  USD: '1.100000',
  GBP: '0.850000',
};

const ORDER: readonly ('USD' | 'GBP')[] = ['USD', 'GBP'];

function pairFor(currency: 'USD' | 'GBP'): RatePair {
  const parsed = parseRateText(SEED_RATE_TEXTS[currency]);
  if (!parsed.ok) throw new Error(`Tipo semilla de ${currency} no válido.`);
  return { micros: parsed.micros, at: new Date(SEED_RATE_AT) };
}

export function createSeedRates(): ExchangeRatesService {
  const pairs = new Map<ForeignCurrency, RatePair>(ORDER.map((c) => [c, pairFor(c)]));
  const get = (currency: ForeignCurrency): RatePair => {
    const pair = pairs.get(currency);
    if (pair === undefined) throw new Error(`Sin tipo semilla para ${currency}.`);
    return pair;
  };
  return {
    getRate: (currency) => Promise.resolve(get(currency)),
    getAll: () =>
      Promise.resolve(
        ORDER.map(
          (currency): RateItem => ({
            currency,
            exchangeRate: formatRate(get(currency).micros),
            exchangeRateAt: SEED_RATE_AT,
          }),
        ),
      ),
  };
}
