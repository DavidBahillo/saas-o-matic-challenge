// CA9: el producto intermedio es un entero seguro y coincide con una referencia exacta (BigInt solo aquí).
import { describe, expect, it } from 'vitest';
import { convertCents } from './convert-cents';
import { convertQuote } from './convert-quote';
import { EUR_MICROS, RATE_MAX_MICROS, RATE_MIN_MICROS } from './types';

const MAX_TOTAL = 61_520_910;
const MAX_BASE = 50_017_000;
const MAX_VAT = 11_503_910;

function reference(cents: number, micros: number): number {
  const p = BigInt(cents) * BigInt(micros) + 500_000n;
  return Number(p / 1_000_000n);
}

describe('conversión: propiedades (CA9)', () => {
  const rates = [RATE_MIN_MICROS, EUR_MICROS, RATE_MAX_MICROS];
  const amounts = [0, 1, 5, 99, 8925, 1_000_003, MAX_BASE, MAX_TOTAL, 12_345_678];

  it.each(rates)('con el tipo %i el producto es seguro y coincide con la referencia', (micros) => {
    for (const cents of amounts) {
      expect(Number.isSafeInteger(cents * micros + 500_000)).toBe(true);
      const out = convertCents(cents, micros);
      expect(out).toBe(reference(cents, micros));
      expect(Number.isSafeInteger(out)).toBe(true);
      expect(Object.is(out, -0)).toBe(false);
    }
  });

  it('el importe máximo con el tipo máximo da 6 152 091 000 céntimos', () => {
    expect(convertCents(MAX_TOTAL, RATE_MAX_MICROS)).toBe(6_152_091_000);
  });

  it.each(rates)('convertQuote del máximo con %i suma base e IVA', (micros) => {
    const r = convertQuote({ baseCents: MAX_BASE, vatCents: MAX_VAT }, micros);
    expect(r.convertedTotalCents).toBe(r.convertedBaseCents + r.convertedVatCents);
    expect(Number.isSafeInteger(r.convertedTotalCents)).toBe(true);
  });

  it('un barrido determinista de importes y tipos coincide con la referencia', () => {
    for (let i = 0; i < 2000; i += 1) {
      const cents = (i * 30_757) % (MAX_TOTAL + 1);
      const micros = RATE_MIN_MICROS + ((i * 49_999_937) % (RATE_MAX_MICROS - RATE_MIN_MICROS + 1));
      expect(convertCents(cents, micros)).toBe(reference(cents, micros));
    }
  });
});
