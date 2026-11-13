// Avisos del guardado (RF26, RF27): errores generales, cliente no encontrado y tipo distinto del de la vista previa.
import { parseRateText } from '@saas-o-matic/shared';
import { Link } from 'react-router';
import { formatRateShort } from '../lib/format-rate-text';
import { Button } from '../ui/Button';
import { LiveRegion } from '../ui/LiveRegion';
import type { SimulationErrorView } from './simulator-errors';

export interface SaveNoticesProps {
  view: SimulationErrorView;
  onRetry: () => void;
  onSaveInEur: () => void;
}

export function SaveNotices({ view, onRetry, onSaveInEur }: SaveNoticesProps) {
  if (view.kind === 'not-found') {
    return (
      <div className="state state--error" role="alert">
        <p>Cliente no encontrado</p>
        <Link to="/">Volver a la lista</Link>
      </div>
    );
  }
  if (view.general.length === 0) return null;
  const retryable = view.kind === 'rate-unavailable' || view.kind === 'general';
  return (
    <div className="state state--error" role="alert">
      {view.general.map((message) => (
        <p key={message}>{message}</p>
      ))}
      <div className="state__actions">
        {retryable && <Button onClick={onRetry}>Reintentar</Button>}
        {view.kind === 'rate-unavailable' && <Button onClick={onSaveInEur}>Guardar en EUR</Button>}
      </div>
      <LiveRegion message={view.general.join(' ')} />
    </div>
  );
}

/** Aviso de RF26 cuando el tipo del backend no coincide con el de la vista previa; null si no hay diferencia. */
export function RateDifference({ applied, preview }: { applied: string; preview: string | undefined }) {
  const a = parseRateText(applied);
  const p = preview === undefined ? undefined : parseRateText(preview);
  if (p === undefined || !a.ok || !p.ok || a.micros === p.micros) return null;
  return (
    <p className="notice notice--info">
      {`El tipo aplicado fue ${formatRateShort(applied)}, distinto del de la vista previa (${formatRateShort(preview ?? '')}).`}
    </p>
  );
}
