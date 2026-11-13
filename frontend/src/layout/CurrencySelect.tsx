// Selector de divisa del header (RF24, RF28): EUR, USD y GBP, pie con la hora y fallo con "Reintentar".
import { CURRENCIES } from '@saas-o-matic/shared';
import type { Currency } from '@saas-o-matic/shared';
import type { ChangeEvent } from 'react';
import { formatClock } from '../lib/format-date';
import { useCurrency } from '../state/currency-context';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LiveRegion } from '../ui/LiveRegion';

function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c === value);
}

export function CurrencySelect() {
  const { currency, setCurrency, isAvailable, status, oldestAt, retry, retrying } = useCurrency();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isCurrency(value)) setCurrency(value);
  }

  return (
    <div className="currency">
      <select className="input" aria-label="Divisa" value={currency} onChange={handleChange}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c} disabled={!isAvailable(c)}>
            {c}
          </option>
        ))}
      </select>
      {oldestAt !== undefined && <small className="muted">Tipos actualizados: {formatClock(oldestAt)}</small>}
      {status === 'unavailable' && (
        <div className="currency__warning">
          <Badge tone="warning">Tipos de cambio no disponibles</Badge>
          <Button onClick={retry} disabled={retrying}>
            Reintentar
          </Button>
          <LiveRegion message="Tipos de cambio no disponibles" />
        </div>
      )}
    </div>
  );
}
