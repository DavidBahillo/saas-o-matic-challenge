// Aviso de tipos de cambio no disponibles (RF24, RF-aviso): bajo la cabecera, con "Reintentar".
import { useCurrency } from '../state/currency-context';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AlertIcon } from '../ui/icons';
import { LiveRegion } from '../ui/LiveRegion';

const MESSAGE = 'Tipos de cambio no disponibles';

export function CurrencyNotice() {
  const { rates, status, retry, retrying } = useCurrency();
  // Solo sale si fallan todos los tipos (RF24); una divisa suelta ausente solo se deshabilita.
  const allFailed = status === 'unavailable' || (status === 'ready' && rates.length === 0);
  if (!allFailed) return null;
  return (
    <div className="notice notice--warning currency-notice">
      <AlertIcon />
      <Badge tone="warning">{MESSAGE}</Badge>
      <Button onClick={retry} disabled={retrying}>
        Reintentar
      </Button>
      <LiveRegion message={MESSAGE} />
    </div>
  );
}
