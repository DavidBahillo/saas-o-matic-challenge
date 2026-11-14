// Modo presentación (RF30, RF47, RF48, D-P13): solo existe mientras el detalle de un cliente está montado.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { isPresentationHotkey, isTextEntryTarget } from '../lib/keyboard';

interface PresentationState {
  active: boolean;
  toggle: () => void;
  exit: () => void;
  /** Salida por desmontar el detalle (navegación): sin foco ni anuncio. */
  reset: () => void;
  /** Devuelve y borra la marca de "cambio silencioso" (lo consulta el anuncio de App). */
  consumeSilent: () => boolean;
}

const PresentationContext = createContext<PresentationState | undefined>(undefined);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  // toggle y exit son estables: el efecto de usePresentationHotkeys no debe reiniciarse al cambiar `active`.
  const silent = useRef(false);
  const toggle = useCallback(() => { silent.current = false; setActive((on) => !on); }, []);
  const exit = useCallback(() => { silent.current = false; setActive(false); }, []);
  const reset = useCallback(() => { silent.current = true; setActive(false); }, []);
  const consumeSilent = useCallback(() => { const was = silent.current; silent.current = false; return was; }, []);
  const value = useMemo<PresentationState>(
    () => ({ active, toggle, exit, reset, consumeSilent }),
    [active, toggle, exit, reset, consumeSilent],
  );
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentation(): PresentationState {
  const value = useContext(PresentationContext);
  if (value === undefined) throw new Error('usePresentation debe usarse dentro de PresentationProvider');
  return value;
}

/** Registra Alt+P y Esc en window (Esc no sale con el foco en un campo ni si un tooltip ya lo ha consumido); solo lo usa el detalle del cliente. Al desmontarse, sale de la presentación. */
export function usePresentationHotkeys(): void {
  const { toggle, exit, reset } = usePresentation();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isPresentationHotkey(event)) {
        event.preventDefault();
        toggle();
      } else if (event.key === 'Escape' && !event.defaultPrevented && !isTextEntryTarget(event.target)) {
        exit();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      reset();
    };
  }, [toggle, exit, reset]);
}
