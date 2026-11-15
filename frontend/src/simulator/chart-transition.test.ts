// RF19: fusión de segmentos entrantes y salientes de la barra de tramos, para usuarios 0, 1, 10, 11, 50 y 51.
import { calculateQuote } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { buildChartModel } from './chart-model';
import type { ChartSegment } from './chart-model';
import { growOf, mergeSegments } from './chart-transition';

function segments(users: number): ChartSegment[] {
  const result = calculateQuote({ users, country: 'ES' });
  if (!result.ok) throw new Error('cálculo no válido');
  return buildChartModel(result.value, 480).segments;
}
const keys = (list: readonly { key: string }[]): string[] => list.map((s) => s.key);

describe('mergeSegments (RF19)', () => {
  it('sin cambios devuelve los segmentos con grow igual a sus céntimos y ninguno saliente', () => {
    const merged = mergeSegments(segments(10), segments(10));
    expect(keys(merged)).toEqual(['tier1', 'vat']);
    expect(merged.every((s) => !s.leaving && s.grow === s.cents)).toBe(true);
  });

  it.each([[10, 11, 'tier2'], [50, 51, 'tier3']])('al subir de %i a %i entra el tramo %s', (from, to, key) => {
    const merged = mergeSegments(segments(from), segments(to));
    expect(merged.find((s) => s.key === key)).toMatchObject({ leaving: false });
    expect(merged.some((s) => s.leaving)).toBe(false);
  });

  it.each([[11, 10, 'tier2'], [51, 50, 'tier3']])('al bajar de %i a %i el tramo %s queda saliente con grow 0, antes del IVA', (from, to, key) => {
    const merged = mergeSegments(segments(from), segments(to));
    expect(merged.find((s) => s.key === key)).toMatchObject({ leaving: true, grow: 0 });
    expect(merged.filter((s) => s.leaving)).toHaveLength(1);
    expect(keys(merged).at(-1)).toBe('vat');
    expect(keys(merged).indexOf(key)).toBe(keys(merged).length - 2);
  });

  it('de 1 a 0 usuarios salen todos; de 0 a 1 entran todos; de 0 a 0 no hay nada', () => {
    expect(mergeSegments(segments(1), segments(0)).every((s) => s.leaving && s.grow === 0)).toBe(true);
    expect(mergeSegments([], segments(1)).every((s) => !s.leaving)).toBe(true);
    expect(mergeSegments([], segments(0))).toEqual([]);
  });

  it('un segmento saliente que vuelve a entrar deja de serlo', () => {
    const leaving = mergeSegments(segments(11), segments(10));
    expect(mergeSegments(leaving, segments(11)).some((s) => s.leaving)).toBe(false);
  });
});

describe('growOf (RF19)', () => {
  const [seg] = segments(10) as [ChartSegment];
  it('es 0 si sale o aún no ha entrado y los céntimos en otro caso', () => {
    expect(growOf({ ...seg, leaving: false, grow: seg.cents }, true)).toBe(seg.cents);
    expect(growOf({ ...seg, leaving: false, grow: seg.cents }, false)).toBe(0);
    expect(growOf({ ...seg, leaving: true, grow: 0 }, true)).toBe(0);
  });
});
