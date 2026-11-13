// Proveedor de tipos de cambio falso para los tests HTTP (plan §7): cuenta llamadas, devuelve
// textos fijos, falla o tarda. Ningún test llama a una API real.
import type { ForeignCurrency } from '@saas-o-matic/shared';
import { RateProviderError } from '../../src/rates/rate-provider';
import type { RateProvider, RawRates } from '../../src/rates/rate-provider';

export interface FakeRates {
  provider: RateProvider;
  /** Una entrada por llamada al proveedor (el proveedor da todos los tipos en una sola petición). */
  calls: string[];
  /** Texto crudo de cada divisa en la respuesta; quitar una clave la deja ausente. */
  answers: Partial<Record<ForeignCurrency, string>>;
  /** Si está definido, el proveedor falla con este error (la respuesta entera). */
  failure: Error | undefined;
  /** Espera previa a responder (para simular concurrencia o lentitud). */
  delay: Promise<void> | undefined;
}

export function createFakeRates(): FakeRates {
  const fake: FakeRates = {
    calls: [],
    answers: { USD: '1.1', GBP: '0.85', CHF: '0.95' },
    failure: undefined,
    delay: undefined,
    provider: {
      async fetchRates(): Promise<RawRates> {
        fake.calls.push('fetch');
        await fake.delay;
        if (fake.failure !== undefined) throw fake.failure;
        return { ...fake.answers };
      },
    },
  };
  return fake;
}

/** Fallo del proveedor con una causa que no debe llegar a la respuesta. */
export function providerDown(): RateProviderError {
  return new RateProviderError('https://secret.example.test/v1?apikey=SECRET respondió 503: SECRET-BODY');
}
