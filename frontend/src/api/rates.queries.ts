// Tipos de cambio (RF23, RF24): una sola petición al arrancar (V6), sin reintentos ni refetch automáticos (U7).
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './client';
import { queryKeys } from './query-keys';
import { exchangeRateListSchema } from './schemas';

export function useExchangeRates() {
  return useQuery({
    queryKey: queryKeys.exchangeRates,
    queryFn: () => apiRequest('/exchange-rates', exchangeRateListSchema),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
