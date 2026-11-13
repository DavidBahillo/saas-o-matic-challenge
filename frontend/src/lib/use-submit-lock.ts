// Bloqueo síncrono contra el doble envío: `pending` de la mutación llega a pantalla con retraso (RF11, RF25).
import { useCallback, useEffect, useRef } from 'react';

/** Devuelve `guard(fn)`: ejecuta `fn` una vez hasta que la petición termine (cambia `pending`, `data` o `error`). */
export function useSubmitLock(pending: boolean, data: unknown, error: unknown): (action: () => void) => void {
  const locked = useRef(false);
  useEffect(() => {
    if (!pending) locked.current = false;
  }, [pending, data, error]);
  return useCallback((action) => {
    if (locked.current) return;
    locked.current = true;
    action();
  }, []);
}
