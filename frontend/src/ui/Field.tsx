// Etiqueta + control + error asociado con aria-describedby (RF33).
import { useId } from 'react';
import type { ReactNode } from 'react';

export interface ControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FieldProps {
  label: string;
  errors?: readonly string[];
  children: (control: ControlProps) => ReactNode;
}

export function Field({ label, errors = [], children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasErrors = errors.length > 0;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-describedby': hasErrors ? errorId : undefined,
        'aria-invalid': hasErrors ? true : undefined,
      })}
      {hasErrors && (
        <div id={errorId} className="field__error">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
