// Consultas de clientes y de sus simulaciones (RF4, RF16). El id va tal cual: el backend responde INVALID_ID (D-P17).
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './client';
import { customerListSchema, customerSchema, simulationListSchema } from './schemas';
import { queryKeys } from './query-keys';

/** La clave lleva el q recortado, así una respuesta tardía de otro texto nunca sustituye a la actual (V2). */
export function useCustomers(q: string) {
  const trimmed = q.trim();
  const path = trimmed === '' ? '/customers' : `/customers?q=${encodeURIComponent(trimmed)}`;
  return useQuery({
    queryKey: queryKeys.customerList(trimmed),
    queryFn: () => apiRequest(path, customerListSchema),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => apiRequest(`/customers/${encodeURIComponent(id)}`, customerSchema),
  });
}

export function useCustomerSimulations(id: string) {
  return useQuery({
    queryKey: queryKeys.customerSimulations(id),
    queryFn: () => apiRequest(`/customers/${encodeURIComponent(id)}/simulations`, simulationListSchema),
  });
}
