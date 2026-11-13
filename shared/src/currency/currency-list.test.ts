// Lista fija de divisas (RF1, CA3): orden, tamaño y propiedades de conversión con las 23.
import { describe, expect, it } from 'vitest';
import { convertCents } from './convert-cents';
import { convertQuote } from './convert-quote';
import { CURRENCIES, RATE_MAX_MICROS, RATE_MIN_MICROS } from './types';

const LIST = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'CAD', 'AUD', 'NZD', 'MXN', 'BRL', 'RON', 'HKD', 'SGD', 'CNY', 'ILS', 'ZAR', 'TRY', 'THB', 'AED'];
// Tipos ilustrativos dentro del rango, uno por divisa (del orden de los reales).
const SAMPLE_MICROS = [1.1, 0.85, 0.95, 11.5, 10.6, 7.5, 4.4, 24.4, 1.58, 1.62, 1.99, 20.6, 6.2, 5.3, 8.7, 1.42, 7.4, 3.5, 18.5, 55.6, 37.5, 4.06];

describe('CURRENCIES (RF1)', () => {
  it('son las 23 divisas de la spec, con EUR primero y sin repetidas', () => {
    expect([...CURRENCIES]).toEqual(LIST);
    expect(new Set(CURRENCIES).size).toBe(23);
  });
});

describe('conversión con las 23 divisas (CA3)', () => {
  const LIMITS = [0, 1, 10, 11, 50, 51];
  const rates = [1_000_000, ...SAMPLE_MICROS.map((r) => Math.round(r * 1_000_000))];

  it.each(CURRENCIES.map((c, i) => [c, rates[i] ?? 1_000_000] as const))('%s con tipo %i', (_currency, micros) => {
    expect(micros).toBeGreaterThanOrEqual(RATE_MIN_MICROS);
    expect(micros).toBeLessThanOrEqual(RATE_MAX_MICROS);
    for (const cents of LIMITS.map((u) => u * 1000)) {
      const out = convertCents(cents, micros);
      expect(Number.isSafeInteger(out)).toBe(true);
      expect(out).toBeGreaterThanOrEqual(0);
      expect(Object.is(out, -0)).toBe(false);
      const q = convertQuote({ baseCents: cents, vatCents: Math.round(cents * 0.21) }, micros);
      expect(q.convertedTotalCents).toBe(q.convertedBaseCents + q.convertedVatCents);
      expect(Object.is(q.convertedBaseCents, -0)).toBe(false);
    }
  });
});
