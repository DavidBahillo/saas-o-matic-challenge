// Modelo del gráfico (RF21, RF40) con los importes de la tabla "Tramos e IVA" de la spec.
import { calculateQuote } from '@saas-o-matic/shared';
import type { Quote } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { buildChartModel, halfUpPercent } from './chart-model';

function quoteFor(users: number, country = 'ES'): Quote {
  const result = calculateQuote({ users, country });
  if (!result.ok) throw new Error('cálculo no válido');
  return result.value;
}
const NBSP = String.fromCharCode(0xa0);

describe('halfUpPercent', () => {
  it.each([
    [100, 140, 71],
    [0, 100, 0],
    [1, 2, 50],
    [1, 8, 13],
    [1, 200, 1],
    [1, 201, 0],
    [5, 0, 0],
  ])('%i de %i → %i %%', (part, whole, expected) => {
    expect(halfUpPercent(part, whole)).toBe(expected);
  });
});

describe('buildChartModel: segmentos', () => {
  it('0 usuarios: sin segmentos y sin porcentaje', () => {
    const model = buildChartModel(quoteFor(0), 'EUR');
    expect(model.segments).toEqual([]);
    expect(model.title).toBe('Desglose del coste mensual');
    expect(model.subtitle).toBe('Sin usuarios: no hay coste que desglosar');
  });

  it('1 usuario: tramo 1 e IVA', () => {
    const model = buildChartModel(quoteFor(1), 'EUR');
    expect(model.segments.map((s) => [s.key, s.cents])).toEqual([
      ['tier1', 1000],
      ['vat', 210],
    ]);
  });

  it('11 usuarios: el segmento del tramo 2 es estrecho y su etiqueta va fuera', () => {
    const model = buildChartModel(quoteFor(11), 'EUR');
    expect(model.segments.map((s) => [s.key, s.cents, s.labelOutside])).toEqual([
      ['tier1', 10000, false],
      ['tier2', 800, true],
      ['vat', 2268, false],
    ]);
    expect(model.segments[1]?.label).toBe(`Tramo 2 · 8,00${NBSP}EUR`);
  });

  it('51 usuarios: entra el tramo 3 con 5,00 EUR', () => {
    const keys = buildChartModel(quoteFor(51), 'EUR').segments.map((s) => s.key);
    expect(keys).toEqual(['tier1', 'tier2', 'tier3', 'vat']);
  });

  it('IVA 0 %: el segmento del IVA no se dibuja', () => {
    const keys = buildChartModel(quoteFor(15, 'US'), 'EUR').segments.map((s) => s.key);
    expect(keys).toEqual(['tier1', 'tier2']);
  });

  it('el límite del 12 % es exacto: 12 de 100 va dentro y 11 de 100 fuera', () => {
    const base = { tiers: [], baseCents: 0, vatCents: 0, totalCents: 0 };
    const tier = (subtotalCents: number) => ({ tier: 1 as const, from: 1, to: 10, unitPriceCents: 0, billedUsers: 1, subtotalCents });
    const inside = buildChartModel({ ...base, tiers: [tier(12)], baseCents: 12, vatCents: 88, totalCents: 100 }, 'EUR');
    const outside = buildChartModel({ ...base, tiers: [tier(11)], baseCents: 11, vatCents: 89, totalCents: 100 }, 'EUR');
    expect(inside.segments[0]?.labelOutside).toBe(false);
    expect(outside.segments[0]?.labelOutside).toBe(true);
  });
});

describe('buildChartModel: subtítulo (RF40)', () => {
  it('15 usuarios: "el 71 % sale del tramo 1" con el coste base', () => {
    const model = buildChartModel(quoteFor(15, 'US'), 'EUR');
    expect(model.subtitle).toBe(`Coste mensual: 140,00${NBSP}EUR · el 71 % sale del tramo 1`);
  });

  it('con 100 000 usuarios el tramo con más peso es el 3', () => {
    const model = buildChartModel(quoteFor(100_000), 'EUR');
    expect(model.subtitle).toContain('del tramo 3');
  });

  it('en un empate gana el tramo de número menor', () => {
    const tiers = [
      { tier: 1 as const, from: 1, to: 10, unitPriceCents: 100, billedUsers: 1, subtotalCents: 100 },
      { tier: 2 as const, from: 11, to: 50, unitPriceCents: 100, billedUsers: 1, subtotalCents: 100 },
    ];
    const model = buildChartModel({ tiers, baseCents: 200, vatCents: 0, totalCents: 200 }, 'EUR');
    expect(model.subtitle).toBe(`Coste mensual: 2,00${NBSP}EUR · el 50 % sale del tramo 1`);
  });
});
