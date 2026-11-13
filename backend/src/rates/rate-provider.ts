import type { ForeignCurrency } from '@saas-o-matic/shared';

/** Fallo del proveedor. El mensaje es fijo: nunca incluye la URL ni el cuerpo de la API (CA7 de la 004). */
export class RateProviderError extends Error {
  override readonly name = 'RateProviderError';
}

/** Texto crudo del número de cada divisa extranjera de la lista presente en la respuesta (sin validar el rango). */
export type RawRates = Readonly<Partial<Record<ForeignCurrency, string>>>;

export interface RateProvider {
  /** Una sola petición con todos los tipos EUR → divisa, o lanza RateProviderError (RF3, RF6). */
  fetchRates(): Promise<RawRates>;
}
