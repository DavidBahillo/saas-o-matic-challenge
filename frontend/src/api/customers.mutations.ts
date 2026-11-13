// Alta de cliente (RF11, RF15): el cuerpo se envía tal cual; al crear se invalida la lista.
import type { Customer } from '@saas-o-matic/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { queryKeys } from './query-keys';
import { customerSchema } from './schemas';

export interface NewCustomerValues {
  companyName: string;
  country: string;
  taxId: string;
  email: string;
  plan: string;
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation<Customer, Error, NewCustomerValues>({
    mutationFn: (values) =>
      apiRequest('/customers', customerSchema, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.customerListAll }),
  });
}
