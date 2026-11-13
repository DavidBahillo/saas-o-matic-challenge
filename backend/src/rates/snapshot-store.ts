// Almacén del snapshot de tipos (007, RF4, RF6, RF7): una caché única en memoria con su instante de
// recepción, vigente con 0 <= antigüedad < 24 h, una sola petición en vuelo compartida y 60 s sin
// llamar al proveedor tras un fallo. Nunca se usa un snapshot caducado ni se guarda un dato inválido.
import type { ForeignCurrency, RateMicros } from '@saas-o-matic/shared';
import { exchangeRateUnavailable } from '../http/errors';
import type { Clock } from '../services/customers.service';
import { buildPairs } from './build-pairs';
import { RATE_CACHE_TTL_MS, RATE_FAILURE_COOLDOWN_MS } from './constants';
import type { RateProvider } from './rate-provider';

export interface RateSnapshot {
  /** Instante de recepción de la respuesta, igual para todas las divisas. */
  at: Date;
  pairs: ReadonlyMap<ForeignCurrency, RateMicros>;
}

export interface SnapshotStore {
  /** Snapshot vigente, o 500 EXCHANGE_RATE_UNAVAILABLE si no se puede obtener uno válido. */
  get(): Promise<RateSnapshot>;
}

export interface SnapshotStoreDeps {
  provider: RateProvider;
  now: Clock;
}

/** Vigente con 0 <= antigüedad < `limit`; una antigüedad negativa (reloj hacia atrás) no cuenta. */
function isWithin(since: Date, now: Date, limit: number): boolean {
  const age = now.getTime() - since.getTime();
  return age >= 0 && age < limit;
}

export function createSnapshotStore(deps: SnapshotStoreDeps): SnapshotStore {
  let snapshot: RateSnapshot | undefined;
  let inFlight: Promise<RateSnapshot> | undefined;
  let failedAt: Date | undefined;

  async function load(): Promise<RateSnapshot> {
    try {
      const pairs = buildPairs(await deps.provider.fetchRates());
      if (pairs.size === 0) throw new Error('La respuesta del proveedor no trae ninguna divisa válida.');
      snapshot = { at: deps.now(), pairs };
      failedAt = undefined;
      return snapshot;
    } catch (error) {
      console.error('No se pudo obtener el tipo de cambio:', error);
      failedAt = deps.now();
      throw exchangeRateUnavailable();
    }
  }

  async function get(): Promise<RateSnapshot> {
    const now = deps.now();
    if (snapshot !== undefined && isWithin(snapshot.at, now, RATE_CACHE_TTL_MS)) return snapshot;
    if (inFlight !== undefined) return inFlight;
    if (failedAt !== undefined && isWithin(failedAt, now, RATE_FAILURE_COOLDOWN_MS)) throw exchangeRateUnavailable();
    inFlight = load().finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  }

  return { get };
}
