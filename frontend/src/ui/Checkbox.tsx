// Casilla (RF15): input nativo estilado, con estado indeterminado y etiqueta a 8 px.
import { useEffect, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({ label, indeterminate = false, className, disabled, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current !== null) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={['check', disabled ? 'check--disabled' : undefined].filter(Boolean).join(' ')}>
      <input ref={ref} type="checkbox" className={['check__box', className].filter(Boolean).join(' ')} disabled={disabled} {...rest} />
      <span>{label}</span>
    </label>
  );
}
