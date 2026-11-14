// Etiqueta + control + error asociado con aria-describedby (RF10). El error lleva icono además del color y se anuncia
// en una región aria-live estable que existe antes del error (el único anuncio del campo).
import { useId } from 'react';
import type { ReactNode } from 'react';
import { AlertIcon } from './icons';

export interface ControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FieldProps {
  label: string;
  errors?: readonly string[];
  /** La etiqueta queda solo para lectores de pantalla (el campo ya tiene un título visible). */
  hideLabel?: boolean;
  children: (control: ControlProps) => ReactNode;
}

export function Field({ label, errors = [], hideLabel = false, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasErrors = errors.length > 0;
  return (
    <div className="field">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </label>
      {children({
        id,
        'aria-describedby': hasErrors ? errorId : undefined,
        'aria-invalid': hasErrors ? true : undefined,
      })}
      <div id={errorId} className="field__errors" aria-live="polite">
        {hasErrors && (
          <div className="field__error">
            <AlertIcon size={16} />
            <div>
              {errors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
