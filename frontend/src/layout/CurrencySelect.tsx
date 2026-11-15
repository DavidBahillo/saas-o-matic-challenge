// Selector de divisa compacto (RF9, RF-selector): etiqueta "Divisa" solo para lectores (el código del select basta a la vista) y lista de shared/ con nombre. El aviso va en CurrencyNotice.
import { CURRENCIES } from '@saas-o-matic/shared';
import type { Currency } from '@saas-o-matic/shared';
import { useId } from 'react';
import type { ChangeEvent } from 'react';
import { currencyName } from '../lib/currency-names';
import { useCurrency } from '../state/currency-context';
import { SelectShell } from '../ui/SelectShell';

function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c === value);
}

function optionLabel(code: Currency, noRate: boolean): string {
  const label = `${code} · ${currencyName(code)}`;
  return noRate ? `${label} (sin tipo de cambio)` : label;
}

export function CurrencySelect() {
  const { currency, setCurrency, isAvailable, status } = useCurrency();
  const id = useId();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isCurrency(value)) setCurrency(value);
  }

  return (
    <div className="currency">
      <label htmlFor={id} className="currency__label sr-only">
        Divisa
      </label>
      <SelectShell>
        <select id={id} name="currency" autoComplete="off" className="input" value={currency} onChange={handleChange}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c} disabled={!isAvailable(c)}>
              {optionLabel(c, status !== 'loading' && !isAvailable(c))}
            </option>
          ))}
        </select>
      </SelectShell>
    </div>
  );
}
