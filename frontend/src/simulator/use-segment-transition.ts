// Entrada y salida suaves de los segmentos de la barra de tramos (RF19). Los nuevos nacen con grow 0 y pasan a su valor
// dos fotogramas después; los que salen siguen montados (inertes) hasta `transitionend` o un respaldo de 350 ms.
// La decisión de texto (`display`) ya viene calculada por `buildChartModel` con el ancho final, no se anima.
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../ui/use-reduced-motion';
import type { ChartSegment } from './chart-model';
import { growOf, mergeSegments } from './chart-transition';
import type { TransitionSegment } from './chart-transition';

export const LEAVE_FALLBACK_MS = 350;

export interface SegmentTransition {
  segments: TransitionSegment[];
  /** Retira los segmentos salientes (al terminar la transición de `flex-grow`). */
  onEnd: () => void;
}

function useEnteredKeys(keys: string[]): ReadonlySet<string> {
  const signature = keys.join();
  const [entered, setEntered] = useState<ReadonlySet<string>>(() => new Set(keys));
  useEffect(() => {
    const wanted = signature === '' ? [] : signature.split(',');
    if (wanted.every((k) => entered.has(k))) {
      if (entered.size !== wanted.length) setEntered(new Set(wanted)); // el que sale deja de contar como "entrado"
      return undefined;
    }
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => { setEntered(new Set(wanted)); });
    });
    return () => { window.cancelAnimationFrame(first); window.cancelAnimationFrame(second); };
  }, [signature, entered]);
  return entered;
}

export function useSegmentTransition(next: readonly ChartSegment[]): SegmentTransition {
  const reduced = useReducedMotion();
  const keys = next.map((s) => s.key);
  const signature = keys.join();
  const [track, setTrack] = useState({ signature, segments: next });
  const [ghosts, setGhosts] = useState<readonly ChartSegment[]>([]);
  const entered = useEnteredKeys(keys);

  if (track.signature !== signature) {
    setTrack({ signature, segments: next });
    setGhosts(mergeSegments([...track.segments, ...ghosts], next).filter((s) => s.leaving));
  }
  useEffect(() => {
    if (ghosts.length === 0) return undefined;
    const timer = window.setTimeout(() => { setGhosts([]); }, LEAVE_FALLBACK_MS);
    return () => { window.clearTimeout(timer); };
  }, [ghosts]);

  if (reduced) return { segments: mergeSegments([], next), onEnd: () => undefined };
  const segments = mergeSegments(ghosts, next).map((s) => ({ ...s, grow: growOf(s, entered.has(s.key)) }));
  return { segments, onEnd: () => { setGhosts([]); } };
}
