// Preferencia de movimiento reducido (RF28): sigue en vivo `prefers-reduced-motion: reduce`.
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function read(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const update = (): void => { setReduced(media.matches); };
    update();
    media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); };
  }, []);
  return reduced;
}
