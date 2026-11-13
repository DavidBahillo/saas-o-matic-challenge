// Proveedor de tipos de cambio falso para los tests HTTP (plan §7): cuenta llamadas, devuelve
// textos fijos, falla o tarda. Ningún test llama a una API real.
import type { ForeignCurrency } from '@saas-o-matic/shared';
import { RateProviderError } from '../../src/rates/rate-provider';
import type { RateProvider } from '../../src/rates/rate-provider';

export interface FakeRates {
  provider: RateProvider;
  /** Divisas pedidas al proveedor, en orden. */
  calls: ForeignCurrency[];
  /** Texto que devuelve cada divisa, o un Error para simular un fallo. */
  answers: Record<ForeignCurrency, string | Error>;
  /** Espera previa a responder (para simular concurrencia o lentitud). */
  delay: Promise<void> | undefined;
}

export function createFakeRates(): FakeRates {
  const fake: FakeRates = {
    calls: [],
    answers: { USD: '1.1', GBP: '0.85' },
    delay: undefined,
    provider: {
      async fetchRate(currency) {
        fake.calls.push(currency);
        await fake.delay;
        const answer = fake.answers[currency];
        if (answer instanceof Error) throw answer;
        return answer;
      },
    },
  };
  return fake;
}

/** Fallo del proveedor con una causa que no debe llegar a la respuesta. */
export function providerDown(): RateProviderError {
  return new RateProviderError('https://secret.example.test/v1?apikey=SECRET respondió 503: SECRET-BODY');
}
