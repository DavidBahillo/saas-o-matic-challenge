// Modo presentación (RF30, D-P13): solo existe mientras el detalle de un cliente está montado.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isPresentationHotkey } from '../lib/keyboard';

interface PresentationState {
  active: boolean;
  toggle: () => void;
  exit: () => void;
}

const PresentationContext = createContext<PresentationState | undefined>(undefined);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  // toggle y exit son estables: el efecto de usePresentationHotkeys no debe reiniciarse al cambiar `active`.
  const toggle = useCallback(() => { setActive((on) => !on); }, []);
  const exit = useCallback(() => { setActive(false); }, []);
  const value = useMemo<PresentationState>(() => ({ active, toggle, exit }), [active, toggle, exit]);
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentation(): PresentationState {
  const value = useContext(PresentationContext);
  if (value === undefined) throw new Error('usePresentation debe usarse dentro de PresentationProvider');
  return value;
}

/** Registra P y Esc en window; solo lo usa el detalle del cliente. Al desmontarse, sale de la presentación. */
export function usePresentationHotkeys(): void {
  const { toggle, exit } = usePresentation();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isPresentationHotkey(event)) toggle();
      else if (event.key === 'Escape') exit();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      exit();
    };
  }, [toggle, exit]);
}
