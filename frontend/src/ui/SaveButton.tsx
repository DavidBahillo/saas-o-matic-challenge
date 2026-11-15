// Botón "Guardar" con icono (spec 010, RF24, RF25). Pendiente: "Guardando…" sin icono y deshabilitado.
// `ariaLabel` solo se pasa donde el nombre accesible debe ser más largo (la hoja: "Guardar simulación").
import type { ButtonProps } from './Button';
import { Button } from './Button';
import { SaveIcon } from './icons';

export type SaveButtonProps = Omit<ButtonProps, 'children'> & { pending: boolean; ariaLabel?: string };

export function SaveButton({ pending, ariaLabel, disabled, ...rest }: SaveButtonProps) {
  return (
    <Button variant="primary" {...rest} disabled={pending || disabled} aria-label={pending ? undefined : ariaLabel}>
      {pending ? 'Guardando…' : (
        <>
          <SaveIcon size={18} />
          Guardar
        </>
      )}
    </Button>
  );
}
