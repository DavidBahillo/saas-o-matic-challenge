import type { Quote } from '../pricing/types';
import { convertCents } from './convert-cents';
import type { ConvertedAmounts, RateMicros } from './types';

/** Convierte base e IVA por separado; el total es su suma, no la conversión de `totalCents` (RF5, RF7). */
export function convertQuote(quote: Pick<Quote, 'baseCents' | 'vatCents'>, micros: RateMicros): ConvertedAmounts {
  const convertedBaseCents = convertCents(quote.baseCents, micros);
  const convertedVatCents = convertCents(quote.vatCents, micros);
  return { convertedBaseCents, convertedVatCents, convertedTotalCents: convertedBaseCents + convertedVatCents };
}
