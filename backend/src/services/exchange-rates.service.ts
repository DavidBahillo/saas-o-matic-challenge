// Servicio de tipos de cambio (007): delgado, sobre el almacén de snapshot (RF4 a RF8). `getRate` y
// `getAll` leen del mismo snapshot, así que el par (tipo, instante) es coherente aunque otra petición
// lo renueve. Una divisa ausente del snapshot es no disponible (RF5) y no provoca otra llamada (PT4).
import type { ForeignCurrency, RateMicros } from '@saas-o-matic/shared';
import { formatRate } from '@saas-o-matic/shared';
import { exchangeRateUnavailable } from '../http/errors';
import type { RateProvider } from '../rates/rate-provider';
import { createSnapshotStore } from '../rates/snapshot-store';
import type { Clock } from './customers.service';

/** Tipo y el instante en que se obtuvo: forman un par (RF17 de la 004). */
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
  /** 500 EXCHANGE_RATE_UNAVAILABLE si no hay snapshot o la divisa pedida no está en él (RF5, RF6). */
  getRate(currency: ForeignCurrency): Promise<RatePair>;
  /** Una entrada por divisa disponible en el snapshot, en el orden de la lista (RF8). */
  getAll(): Promise<RateItem[]>;
}

export interface ExchangeRatesDeps {
  provider: RateProvider;
  now: Clock;
}

export function createExchangeRatesService(deps: ExchangeRatesDeps): ExchangeRatesService {
  const store = createSnapshotStore(deps);
  return {
    async getRate(currency) {
      const snapshot = await store.get();
      const micros = snapshot.pairs.get(currency);
      if (micros === undefined) throw exchangeRateUnavailable();
      return { micros, at: snapshot.at };
    },
    async getAll() {
      const snapshot = await store.get();
      const at = snapshot.at.toISOString();
      return [...snapshot.pairs].map(([currency, micros]) => ({
        currency,
        exchangeRate: formatRate(micros),
        exchangeRateAt: at,
      }));
    },
  };
}
