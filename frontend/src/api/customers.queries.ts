// Consultas de clientes y de sus simulaciones (RF4, RF16). El id va tal cual: el backend responde INVALID_ID (D-P17).
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './client';
import { customerListSchema, customerSchema, simulationListSchema } from './schemas';
import { queryKeys } from './query-keys';

/** La clave lleva el q recortado, así una respuesta tardía de otro texto nunca sustituye a la actual (V2). */
export function useCustomers(q: string, page = 1) {
  const trimmed = q.trim();
  const params = [...(trimmed === '' ? [] : [`q=${encodeURIComponent(trimmed)}`]), ...(page > 1 ? [`page=${String(page)}`] : [])];
  const path = params.length === 0 ? '/customers' : `/customers?${params.join('&')}`;
  return useQuery({
    queryKey: queryKeys.customerList(trimmed, page),
    queryFn: () => apiRequest(path, customerListSchema),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => apiRequest(`/customers/${encodeURIComponent(id)}`, customerSchema),
  });
}

/** Datos del formulario de edición (RF8): siempre del servidor al montar y sin refrescos que pisen lo que escribe el usuario. */
export function useCustomerForEdit(id: string) {
  return useQuery({
    queryKey: queryKeys.customerEdit(id),
    queryFn: () => apiRequest(`/customers/${encodeURIComponent(id)}`, customerSchema),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCustomerSimulations(id: string) {
  return useQuery({
    queryKey: queryKeys.customerSimulations(id),
    queryFn: () => apiRequest(`/customers/${encodeURIComponent(id)}/simulations`, simulationListSchema),
  });
}
