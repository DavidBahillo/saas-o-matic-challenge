import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'warning' | 'error' | 'info' | 'success';

interface BadgeProps {
  tone?: BadgeTone;
  /** "no" para códigos y valores que no se traducen (plan, divisa). */
  translate?: 'yes' | 'no';
  children: ReactNode;
}

export function Badge({ tone = 'neutral', translate, children }: BadgeProps) {
  return <span className={`badge badge--${tone}`} translate={translate}>{children}</span>;
}
