// Fusión de segmentos de la barra de tramos (RF19): los que ya no están siguen en el DOM como salientes hasta encoger a 0.
import type { ChartSegment } from './chart-model';

export interface TransitionSegment extends ChartSegment {
  leaving: boolean;
  /** `flex-grow` objetivo: los céntimos del segmento, o 0 si sale. */
  grow: number;
}

const ORDER: readonly ChartSegment['key'][] = ['tier1', 'tier2', 'tier3', 'vat'];

/** Mantiene como `leaving` (grow 0) los segmentos de `prev` que ya no están en `next`, en su posición canónica. */
export function mergeSegments(prev: readonly ChartSegment[], next: readonly ChartSegment[]): TransitionSegment[] {
  const merged: TransitionSegment[] = [];
  for (const key of ORDER) {
    const current = next.find((s) => s.key === key);
    const old = prev.find((s) => s.key === key);
    if (current !== undefined) merged.push({ ...current, leaving: false, grow: current.cents });
    else if (old !== undefined) merged.push({ ...old, leaving: true, grow: 0 });
  }
  return merged;
}

/** grow objetivo: cents del segmento, o 0 si sale o aún no ha entrado (primer fotograma). */
export function growOf(segment: TransitionSegment, entered: boolean): number {
  return segment.leaving || !entered ? 0 : segment.cents;
}
