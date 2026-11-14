// Ancho útil de un elemento (clientWidth: sin el borde), medido antes del primer pintado con useLayoutEffect y
// mantenido con ResizeObserver; sin medida (jsdom) o sin observador, el ancho por defecto.
import { useLayoutEffect, useRef, useState } from 'react';

export function useElementWidth<T extends HTMLElement>(defaultPx: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(defaultPx);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    const read = (): void => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, []);
  return { ref, width };
}
