// Estados reutilizables de carga, error y vacío (RF-estados, principio 8). Cada uno se anuncia en aria-live.
import type { ReactNode } from 'react';
import { Button } from './Button';
import { AlertIcon } from './icons';
import { LiveRegion } from './LiveRegion';

export function Skeleton({ lines = 3, label = 'Cargando…' }: { lines?: number; label?: string }) {
  return (
    <div className="skeleton-group" data-testid="skeleton">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" aria-hidden="true" />
      ))}
      <LiveRegion message={label} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state state--error">
      <div className="state__row">
        <AlertIcon />
        <p>{message}</p>
      </div>
      <Button onClick={onRetry}>Reintentar</Button>
      <LiveRegion message={message} />
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="state state--empty">
      <svg className="state__icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <rect x="6" y="12" width="36" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M6 20h36" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p>{title}</p>
      {action}
      <LiveRegion message={title} />
    </div>
  );
}
