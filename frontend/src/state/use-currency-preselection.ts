// Preselección de la divisa del país por visita (RF14, RF15): se aplica una sola vez con los tipos disponibles.
import { currencyForCountry } from '@saas-o-matic/shared';
import type { Currency } from '@saas-o-matic/shared';
import { useEffect, useRef, useState } from 'react';
import { useCurrency } from './currency-context';
import type { RatesStatus } from './currency-context';

/** Devuelve true cuando la divisa ya está decidida: el simulador no se pinta antes (sin parpadeo). */
export function useCurrencyPreselection(country: string): boolean {
  const { status, isAvailable, applyCountryCurrency, hasManualChoice } = useCurrency();
  const [applied, setApplied] = useState(false);
  const handled = useRef<RatesStatus>('loading');
  // `done`: la divisa del país ya se aplicó con tipos listos; ready -> unavailable -> ready no la reaplica.
  const done = useRef(false);

  useEffect(() => {
    if (status === 'loading' || handled.current === status || done.current) return;
    handled.current = status;
    if (!hasManualChoice()) {
      const result = currencyForCountry(country);
      const wanted: Currency = result.ok ? result.currency : 'EUR';
      applyCountryCurrency(status === 'ready' && isAvailable(wanted) ? wanted : 'EUR');
    }
    if (status === 'ready') done.current = true;
    setApplied(true);
  }, [status, country, isAvailable, applyCountryCurrency, hasManualChoice]);

  return applied;
}
