import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ACME, CUSTOMER_LIST_BODY, SIMULATION_USD } from '../test/fixtures';
import { mockFetch } from '../test/mock-fetch';
import { useCustomer, useCustomerForEdit, useCustomerSimulations, useCustomers } from './customers.queries';
import { queryKeys } from './query-keys';
import { createQueryClient } from './query-client';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('consultas de clientes', () => {
  it('useCustomers pide /customers sin q con texto vacío o de espacios', async () => {
    const mock = mockFetch({ 'GET /api/customers': { body: CUSTOMER_LIST_BODY } });
    const { result } = renderHook(() => useCustomers('   '), { wrapper });
    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(mock.calls[0]?.query.has('q')).toBe(false);
  });

  it('useCustomers envía el q recortado y codificado', async () => {
    const mock = mockFetch({ 'GET /api/customers': { body: CUSTOMER_LIST_BODY } });
    const { result } = renderHook(() => useCustomers(' acme & co '), { wrapper });
    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(mock.calls[0]?.query.get('q')).toBe('acme & co');
  });

  it('useCustomers añade page solo si es mayor que 1 y lo combina con q', async () => {
    const mock = mockFetch({ 'GET /api/customers': { body: CUSTOMER_LIST_BODY } });
    const first = renderHook(() => useCustomers('', 1), { wrapper });
    const third = renderHook(() => useCustomers('ac', 3), { wrapper });
    await waitFor(() => { expect(first.result.current.isSuccess && third.result.current.isSuccess).toBe(true); });
    expect(mock.calls.map((c) => [c.query.get('q'), c.query.get('page')])).toEqual([[null, null], ['ac', '3']]);
  });

  it('la clave de la lista incluye q y página', () => {
    expect(queryKeys.customerList('ac', 2)).toEqual(['customers', 'list', 'ac', 2]);
  });

  it('useCustomerForEdit lee el cliente del servidor', async () => {
    mockFetch({ 'GET /api/customers/7': { body: ACME } });
    const { result } = renderHook(() => useCustomerForEdit('7'), { wrapper });
    await waitFor(() => { expect(result.current.data?.companyName).toBe('Acme Ibérica SL'); });
  });

  it('useCustomer y useCustomerSimulations leen el detalle y { items }', async () => {
    mockFetch({
      'GET /api/customers/7': { body: ACME },
      'GET /api/customers/7/simulations': { body: { items: [SIMULATION_USD] } },
    });
    const customer = renderHook(() => useCustomer('7'), { wrapper });
    const simulations = renderHook(() => useCustomerSimulations('7'), { wrapper });
    await waitFor(() => { expect(customer.result.current.data?.companyName).toBe('Acme Ibérica SL'); });
    await waitFor(() => { expect(simulations.result.current.data?.items[0]?.id).toBe(2); });
  });
});
