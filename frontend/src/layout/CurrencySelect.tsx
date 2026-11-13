// Selector de divisa del header (RF9, RF12, RF24, RF28): lista de shared/ con nombre, pie con hora y atribución.
import { CURRENCIES } from '@saas-o-matic/shared';
import type { Currency } from '@saas-o-matic/shared';
import type { ChangeEvent } from 'react';
import { currencyName } from '../lib/currency-names';
import { formatClock } from '../lib/format-date';
import { useCurrency } from '../state/currency-context';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LiveRegion } from '../ui/LiveRegion';
import { RatesAttribution } from '../ui/RatesAttribution';

function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c === value);
}

function optionLabel(code: Currency, noRate: boolean): string {
  const label = `${code} · ${currencyName(code)}`;
  return noRate ? `${label} (sin tipo de cambio)` : label;
}

export function CurrencySelect() {
  const { currency, setCurrency, isAvailable, rates, status, oldestAt, retry, retrying } = useCurrency();
  // El badge solo sale si fallan todos los tipos (RF24); una divisa suelta ausente solo se deshabilita.
  const allFailed = status === 'unavailable' || (status === 'ready' && rates.length === 0);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isCurrency(value)) setCurrency(value);
  }

  return (
    <div className="currency">
      <select className="input" aria-label="Divisa" value={currency} onChange={handleChange}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c} disabled={!isAvailable(c)}>
            {optionLabel(c, status !== 'loading' && !isAvailable(c))}
          </option>
        ))}
      </select>
      {oldestAt !== undefined && (
        <div className="currency__foot">
          <small className="muted">Tipos actualizados: {formatClock(oldestAt)}</small>
          <RatesAttribution />
        </div>
      )}
      {allFailed && (
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
