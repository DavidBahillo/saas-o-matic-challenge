// RF28: la preferencia de movimiento reducido se lee de matchMedia y se sigue en vivo.
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './use-reduced-motion';

type Listener = () => void;

function stubMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const query = { matches: initial, addEventListener: (_: string, l: Listener) => listeners.add(l), removeEventListener: (_: string, l: Listener) => listeners.delete(l) };
  const matchMedia = vi.fn(() => query);
  vi.stubGlobal('matchMedia', matchMedia);
  return { query, listeners, matchMedia, change: (value: boolean) => { query.matches = value; listeners.forEach((l) => { l(); }); } };
}

describe('useReducedMotion (RF28)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('consulta prefers-reduced-motion: reduce y devuelve su valor', () => {
    const media = stubMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(media.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('sigue los cambios y deja de escuchar al desmontar', () => {
    const media = stubMedia(false);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => { media.change(true); });
    expect(result.current).toBe(true);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('sin matchMedia devuelve false', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
