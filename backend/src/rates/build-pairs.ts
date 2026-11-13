// RawRates → pares válidos (RF3, RF5): una divisa ausente, no decimal o fuera de rango se descarta
// por separado y nunca llega a la caché. Un solo parseo: `parseRateText` de shared/.
import { CURRENCIES, parseRateText } from '@saas-o-matic/shared';
import type { ForeignCurrency, RateMicros } from '@saas-o-matic/shared';
import type { RawRates } from './rate-provider';

const FOREIGN: readonly ForeignCurrency[] = CURRENCIES.filter((c): c is ForeignCurrency => c !== 'EUR');

export function buildPairs(raw: RawRates): ReadonlyMap<ForeignCurrency, RateMicros> {
  const pairs = new Map<ForeignCurrency, RateMicros>();
  for (const currency of FOREIGN) {
    const text = raw[currency];
    if (text === undefined) continue;
    const parsed = parseRateText(text);
    if (parsed.ok) pairs.set(currency, parsed.micros);
  }
  return pairs;
}
