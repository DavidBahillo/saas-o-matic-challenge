// QueryClient sin reintentos ni refetch al enfocar la ventana (D-P2, U7, V6).
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
}
