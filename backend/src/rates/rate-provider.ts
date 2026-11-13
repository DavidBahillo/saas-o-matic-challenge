import type { ForeignCurrency } from '@saas-o-matic/shared';

/** Fallo del proveedor. El mensaje es fijo: nunca incluye la URL ni el cuerpo de la API (CA7). */
export class RateProviderError extends Error {
  override readonly name = 'RateProviderError';
}

export interface RateProvider {
  /** Texto decimal del tipo EUR → `currency` tal como lo devuelve la API, o lanza RateProviderError. */
  fetchRate(currency: ForeignCurrency): Promise<string>;
}
