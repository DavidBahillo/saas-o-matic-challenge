// Radio (RF15): input nativo estilado como círculo, con punto interior al seleccionarse.
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Radio({ label, className, disabled, ...rest }: RadioProps) {
  return (
    <label className={['check', disabled ? 'check--disabled' : undefined].filter(Boolean).join(' ')}>
      <input type="radio" className={['check__box', 'check__box--radio', className].filter(Boolean).join(' ')} disabled={disabled} {...rest} />
      <span>{label}</span>
    </label>
  );
}
