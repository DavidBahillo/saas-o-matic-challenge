// Divisa activa y disponibilidad de los tipos de cambio (D-P12, RF23, RF24, RF28).
import type { Currency } from '@saas-o-matic/shared';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useExchangeRates } from '../api/rates.queries';
import type { ExchangeRate } from '../api/schemas';
import { oldestRateAt } from '../lib/format-date';

export type RatesStatus = 'loading' | 'ready' | 'unavailable';

export interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: readonly ExchangeRate[];
  status: RatesStatus;
  /** EUR siempre; USD y GBP solo con tipos cargados. */
  isAvailable: (currency: Currency) => boolean;
  retry: () => void;
  retrying: boolean;
  /** Hora más antigua de los tipos recibidos (V5). */
  oldestAt: string | undefined;
}

const CurrencyContext = createContext<CurrencyState | undefined>(undefined);

const EMPTY_RATES: readonly ExchangeRate[] = [];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const query = useExchangeRates();
  const [currency, setCurrency] = useState<Currency>('EUR');
  const status: RatesStatus = query.isError ? 'unavailable' : query.isSuccess ? 'ready' : 'loading';
  const rates = query.data?.items ?? EMPTY_RATES;
  const { refetch } = query;

  // Si fallan los tipos, la divisa activa vuelve a EUR (RF24); al recuperarse no se cambia.
  useEffect(() => {
    if (status === 'unavailable') setCurrency('EUR');
  }, [status]);

  const value = useMemo<CurrencyState>(
    () => ({
      currency,
      setCurrency,
      rates,
      status,
      isAvailable: (c) => c === 'EUR' || (status === 'ready' && rates.some((r) => r.currency === c)),
      retry: () => void refetch(),
      retrying: query.isFetching && status === 'unavailable',
      oldestAt: oldestRateAt(rates),
    }),
    [currency, rates, status, refetch, query.isFetching],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyState {
  const value = useContext(CurrencyContext);
  if (value === undefined) throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  return value;
}
