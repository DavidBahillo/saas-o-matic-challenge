// Tarjeta (RF11, RF15): por defecto con borde, `elevated` con sombra md (superficie y borde en oscuro) y cabecera opcional.
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  header?: ReactNode;
}

export function Card({ elevated = false, header, className, children, ...rest }: CardProps) {
  const classes = ['card', elevated ? 'card--elevated' : undefined, className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {header !== undefined && <div className="card__header">{header}</div>}
      {children}
    </div>
  );
}
