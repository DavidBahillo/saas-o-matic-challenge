// ¿Desborda el contenido horizontalmente? (RF52) Se mide antes del primer pintado y con ResizeObserver sobre el contenedor
// y la tabla (el contenido puede crecer sin que cambie el contenedor); sin medida (jsdom), false.
import { useLayoutEffect, useRef, useState } from 'react';

export function useOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    const read = (): void => { setOverflows(el.scrollWidth > el.clientWidth); };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    const table = el.querySelector('table');
    if (table !== null) observer.observe(table);
    return () => { observer.disconnect(); };
  }, []);
  return { ref, overflows };
}
