// Divisa activa y disponibilidad de los tipos de cambio (D-P12, RF23, RF24, RF28; RF11, RF14 y RF15 de la 007).
import type { Currency } from '@saas-o-matic/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useExchangeRates } from '../api/rates.queries';
import type { ExchangeRate } from '../api/schemas';

export type RatesStatus = 'loading' | 'ready' | 'unavailable';

export interface CurrencyState {
  currency: Currency;
  /** Elección del usuario: marca la visita como "elegida a mano" (RF15). */
  setCurrency: (currency: Currency) => void;
  /** Preselección por país: cambia la divisa sin marcar elección manual (RF14). */
  applyCountryCurrency: (currency: Currency) => void;
  /** Inicia una visita al simulador: borra la marca de elección manual (RF15). */
  beginVisit: () => void;
  hasManualChoice: () => boolean;
  rates: readonly ExchangeRate[];
  status: RatesStatus;
  /** EUR siempre; las demás solo si traen tipo en el snapshot. */
  isAvailable: (currency: Currency) => boolean;
  retry: () => void;
  retrying: boolean;
}

const CurrencyContext = createContext<CurrencyState | undefined>(undefined);

const EMPTY_RATES: readonly ExchangeRate[] = [];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const query = useExchangeRates();
  const [currency, setActive] = useState<Currency>('EUR');
  const manual = useRef(false);
  const status: RatesStatus = query.isError ? 'unavailable' : query.isSuccess ? 'ready' : 'loading';
  const rates = query.data?.items ?? EMPTY_RATES;
  const { refetch } = query;

  const setCurrency = useCallback((next: Currency) => {
    manual.current = true;
    setActive(next);
  }, []);
  const applyCountryCurrency = useCallback((next: Currency) => { setActive(next); }, []);
  const beginVisit = useCallback(() => { manual.current = false; }, []);
  const hasManualChoice = useCallback(() => manual.current, []);

  const isAvailable = useCallback(
    (c: Currency) => c === 'EUR' || (status === 'ready' && rates.some((r) => r.currency === c)),
    [status, rates],
  );

  // Si la divisa activa deja de estar disponible (fallo de tipos o snapshot sin ella), vuelve a EUR (RF11).
  useEffect(() => {
    if (status !== 'loading' && !isAvailable(currency)) setActive('EUR');
  }, [status, currency, isAvailable]);

  const value = useMemo<CurrencyState>(
    () => ({
      currency,
      setCurrency,
      applyCountryCurrency,
      beginVisit,
      hasManualChoice,
      rates,
      status,
      isAvailable,
      retry: () => void refetch(),
      retrying: query.isFetching && status === 'unavailable',
    }),
    [currency, setCurrency, applyCountryCurrency, beginVisit, hasManualChoice, rates, status, isAvailable, refetch, query.isFetching],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyState {
  const value = useContext(CurrencyContext);
  if (value === undefined) throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  return value;
}
