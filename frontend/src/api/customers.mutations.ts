// Alta, edición y borrado de clientes (RF11, RF12, RF15, RF20, RF25): el cuerpo se envía tal cual.
import type { Customer } from '@saas-o-matic/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { ApiError } from './errors';
import { queryKeys } from './query-keys';
import { customerSchema, deleteResultSchema } from './schemas';

export interface NewCustomerValues {
  companyName: string;
  country: string;
  taxId: string;
  email: string;
  plan: string;
}

export interface DeleteOutcome {
  deletedSimulations: number;
  /** El cliente ya no existía (404): para la interfaz es un éxito (RF25). */
  alreadyGone: boolean;
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation<Customer, Error, NewCustomerValues>({
    mutationFn: (values) =>
      apiRequest('/customers', customerSchema, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.customerListAll }),
  });
}

/** PUT del cliente; invalidar ['customers'] cubre lista, detalle y simulaciones (RF12). */
export function useUpdateCustomer(id: string) {
  const client = useQueryClient();
  return useMutation<Customer, Error, NewCustomerValues>({
    mutationFn: (values) =>
      apiRequest(`/customers/${encodeURIComponent(id)}`, customerSchema, { method: 'PUT', body: JSON.stringify(values) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.customers }),
  });
}

async function deleteCustomer(id: number): Promise<DeleteOutcome> {
  try {
    const result = await apiRequest(`/customers/${String(id)}`, deleteResultSchema, { method: 'DELETE' });
    return { ...result, alreadyGone: false };
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'api' && error.status === 404) {
      return { deletedSimulations: 0, alreadyGone: true };
    }
    throw error;
  }
}

export function useDeleteCustomer() {
  const client = useQueryClient();
  return useMutation<DeleteOutcome, Error, number>({
    mutationFn: deleteCustomer,
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: queryKeys.customer(String(id)) });
      client.removeQueries({ queryKey: queryKeys.customerEdit(String(id)) });
      return client.invalidateQueries({ queryKey: queryKeys.customerListAll });
    },
  });
}
