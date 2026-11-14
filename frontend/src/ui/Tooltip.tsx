// Tooltip reutilizable (RF14): 150 ms al mostrar, 0 ms al ocultar, Escape lo cierra y permanece bajo el ratón.
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

export const TOOLTIP_DELAY_MS = 150;

export interface TooltipProps {
  text: string;
  /** Clase y estilo opcionales del envoltorio (p. ej. segmentos flex de la barra). */
  className?: string;
  style?: CSSProperties;
  /** Con false nunca se muestra (el envoltorio sigue montado, p. ej. segmentos con el texto completo). */
  enabled?: boolean;
  /** Con false el disparador no recibe aria-describedby y la burbuja va oculta a lectores (el nombre ya está en el disparador). */
  describe?: boolean;
  /** Pulsar o tocar el disparador alterna el tooltip (táctil, Safari iOS) y el disparador expone aria-expanded. */
  toggle?: boolean;
  /** Un único elemento (enfocable o no): recibe `aria-describedby` mientras el tooltip está visible. */
  children: ReactElement<{ 'aria-describedby'?: string; 'aria-expanded'?: boolean }>;
}

/** Estado del tooltip: 150 ms al mostrar, 0 al ocultar, alternar con el toque y Escape (solo cierra el tooltip). */
function useTooltipState(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const show = useCallback(() => {
    clear();
    if (!enabled) return;
    timer.current = window.setTimeout(() => { setOpen(true); }, TOOLTIP_DELAY_MS);
  }, [clear, enabled]);
  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);
  const flip = useCallback(() => {
    clear();
    setOpen((was) => enabled && !was);
  }, [clear, enabled]);

  useEffect(() => clear, [clear]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      // Solo cierra el tooltip: el listener de window (salir de la presentación) ya no actúa.
      event.preventDefault();
      event.stopPropagation();
      hide();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open, hide]);
  return { open, show, hide, flip };
}

export function Tooltip({ text, className, style, enabled = true, describe = true, toggle = false, children }: TooltipProps) {
  const id = useId();
  const { open, show, hide, flip } = useTooltipState(enabled);
  return (
    <span className={className === undefined ? 'tooltip' : `tooltip ${className}`} style={style} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={toggle ? flip : undefined}>
      {cloneElement(children, {
        'aria-describedby': open && describe ? id : children.props['aria-describedby'],
        ...(toggle ? { 'aria-expanded': open && enabled } : {}),
      })}
      {open && enabled && (
        <span role={describe ? 'tooltip' : undefined} aria-hidden={describe ? undefined : true} id={id} className="tooltip__bubble">
          {text}
        </span>
      )}
    </span>
  );
}
