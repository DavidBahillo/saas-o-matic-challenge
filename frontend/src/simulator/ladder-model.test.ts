// Modelo de la escalera de tramos (RF43, RF24): precios, rangos completos y cortos, alcanzado y textos accesibles.
import { calculateQuote } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { buildLadder, ladderAccessibleText, shortPrice } from './ladder-model';

const NB = String.fromCharCode(0xa0);
const nb = (text: string): string => text.replaceAll(' ', NB);

function ladderFor(users: number) {
  const result = calculateQuote({ users, country: 'ES' });
  if (!result.ok) throw new Error('cálculo no válido');
  return buildLadder(result.value.tiers);
}

describe('buildLadder', () => {
  it('precios, rangos completos y cortos, sin anchura, altura ni texto exterior', () => {
    const steps = ladderFor(23);
    expect(steps.map((s) => s.tier)).toEqual([1, 2, 3]);
    expect(steps.map((s) => [s.from, s.to])).toEqual([[1, 10], [11, 50], [51, null]]);
    expect(steps.map((s) => s.unitPriceCents)).toEqual([1000, 800, 500]);
    expect(steps.map((s) => s.rangeFull)).toEqual(['1–10', '11–50', nb('51 o más')]);
    expect(steps.map((s) => s.rangeShort)).toEqual(['1–10', '11–50', '51+']);
    for (const s of steps) {
      expect(Object.keys(s).sort()).toEqual(['from', 'rangeFull', 'rangeShort', 'reached', 'tier', 'to', 'unitPriceCents']);
    }
  });

  it.each([
    [0, [false, false, false]],
    [1, [true, false, false]],
    [10, [true, false, false]],
    [11, [true, true, false]],
    [50, [true, true, false]],
    [51, [true, true, true]],
  ])('con %i usuarios los tramos alcanzados son %j', (users, reached) => {
    expect(ladderFor(users).map((s) => s.reached)).toEqual(reached);
  });

  it('sin tramos devuelve una lista vacía', () => {
    expect(buildLadder([])).toEqual([]);
  });
});

describe('shortPrice', () => {
  it.each([
    [1000, '10 €'],
    [800, '8 €'],
    [500, '5 €'],
    [1050, '10,50 €'],
    [1005, '10,05 €'],
  ])('%i céntimos → %s', (cents, expected) => {
    expect(shortPrice(cents)).toBe(nb(expected));
  });
});

describe('ladderAccessibleText', () => {
  it('describe el tramo con precio y rango', () => {
    const [t1, t2, t3] = ladderFor(51);
    const norm = (s: string | undefined) => (s ?? '').replace(new RegExp(String.fromCharCode(0xa0), 'g'), ' ');
    expect(norm(t1 && ladderAccessibleText(t1))).toBe('Tramo 1: 10,00 EUR por usuario al mes, de 1 a 10 usuarios');
    expect(norm(t2 && ladderAccessibleText(t2))).toBe('Tramo 2: 8,00 EUR por usuario al mes, de 11 a 50 usuarios');
    expect(norm(t3 && ladderAccessibleText(t3))).toBe('Tramo 3: 5,00 EUR por usuario al mes, desde 51 usuarios');
  });
});
