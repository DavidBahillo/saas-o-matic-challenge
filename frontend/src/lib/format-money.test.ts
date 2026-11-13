import { describe, expect, it } from 'vitest';
import { formatMoney } from './format-money';

describe('formatMoney (RF39)', () => {
  it('muestra 0 como "0,00 EUR", nunca "-0,00"', () => {
    expect(formatMoney(0, 'EUR')).toBe('0,00 EUR');
    expect(formatMoney(-0, 'EUR')).toBe('0,00 EUR');
  });

  it('formatea céntimos con coma decimal y NBSP antes del código', () => {
    expect(formatMoney(12100, 'EUR')).toBe('121,00 EUR');
    expect(formatMoney(1, 'USD')).toBe('0,01 USD');
    expect(formatMoney(56568, 'USD')).toBe('565,68 USD');
  });

  it('agrupa miles también con cuatro cifras', () => {
    expect(formatMoney(123456, 'GBP')).toBe('1.234,56 GBP');
    expect(formatMoney(61520910, 'EUR')).toBe('615.209,10 EUR');
  });

  it('mantiene el signo de un importe negativo', () => {
    expect(formatMoney(-150, 'EUR')).toBe('-1,50 EUR');
  });
});
