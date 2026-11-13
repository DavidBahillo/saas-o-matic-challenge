// Servicio de tipos de cambio con caché en memoria por divisa (plan §7, RF12, RF15-RF18).
// Un tipo es vigente con 0 <= antigüedad < 24 h; si no, se renueva. Nunca se usa un tipo
// caducado ni se guarda un dato inválido. getRate devuelve el mismo par (tipo, instante) que
// acaba de crear, sin releer la caché, para que sea coherente aunque otra petición la renueve.
import { CURRENCIES, formatRate, parseRateText } from '@saas-o-matic/shared';
import type { ForeignCurrency, RateMicros } from '@saas-o-matic/shared';
import { exchangeRateUnavailable } from '../http/errors';
import { RATE_CACHE_TTL_MS } from '../rates/constants';
import type { RateProvider } from '../rates/rate-provider';
import type { Clock } from './customers.service';

/** Tipo y el instante en que se obtuvo: forman un par (RF17). */
export interface RatePair {
  micros: RateMicros;
  at: Date;
}

export interface RateItem {
  currency: ForeignCurrency;
  exchangeRate: string;
  exchangeRateAt: string;
}

export interface ExchangeRatesService {
  /** 500 EXCHANGE_RATE_UNAVAILABLE si no hay tipo vigente y no se puede obtener (RF16). */
  getRate(currency: ForeignCurrency): Promise<RatePair>;
  /** USD y después GBP; si falla alguna, falla entera (V2). */
  getAll(): Promise<RateItem[]>;
}

export interface ExchangeRatesDeps {
  provider: RateProvider;
  now: Clock;
}

const FOREIGN: readonly ForeignCurrency[] = CURRENCIES.filter((c): c is ForeignCurrency => c !== 'EUR');

export function createExchangeRatesService(deps: ExchangeRatesDeps): ExchangeRatesService {
  const cache = new Map<ForeignCurrency, RatePair>();

  function isFresh(pair: RatePair): boolean {
    const age = deps.now().getTime() - pair.at.getTime();
    return age >= 0 && age < RATE_CACHE_TTL_MS;
  }

  async function renew(currency: ForeignCurrency): Promise<RatePair> {
    try {
      const parsed = parseRateText(await deps.provider.fetchRate(currency));
      if (!parsed.ok) throw new Error(`Tipo de ${currency} fuera de formato o de rango (RF12).`);
      const pair: RatePair = { micros: parsed.micros, at: deps.now() };
      cache.set(currency, pair);
      return pair;
    } catch (error) {
      console.error('No se pudo obtener el tipo de cambio:', error);
      throw exchangeRateUnavailable();
    }
  }

  async function getRate(currency: ForeignCurrency): Promise<RatePair> {
    const cached = cache.get(currency);
    return cached !== undefined && isFresh(cached) ? cached : renew(currency);
  }

  return {
    getRate,
    async getAll() {
      const items: RateItem[] = [];
      for (const currency of FOREIGN) {
        const pair = await getRate(currency);
        items.push({ currency, exchangeRate: formatRate(pair.micros), exchangeRateAt: pair.at.toISOString() });
      }
      return items;
    },
  };
}
