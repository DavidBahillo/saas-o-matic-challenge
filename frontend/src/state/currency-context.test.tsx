// RF11: si la divisa activa deja de estar disponible, vuelve a EUR sin error.
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '../api/query-client';
import { queryKeys } from '../api/query-keys';
import { ratesBody } from '../test/fixtures';
import { mockFetch } from '../test/mock-fetch';
import { CurrencyProvider, useCurrency } from './currency-context';

function Probe() {
  const { currency, setCurrency, status } = useCurrency();
  return (
    <>
      <output data-testid="currency">{currency}</output>
      <output data-testid="status">{status}</output>
      <button onClick={() => { setCurrency('SEK'); }}>SEK</button>
    </>
  );
}

describe('CurrencyProvider (RF11)', () => {
  it('la activa (SEK) vuelve a EUR si el nuevo snapshot ya no la trae', async () => {
    let body = ratesBody();
    mockFetch({ 'GET /api/exchange-rates': () => ({ body }) });
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <CurrencyProvider><Probe /></CurrencyProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => { expect(screen.getByTestId('status')).toHaveTextContent('ready'); });
    await userEvent.setup().click(screen.getByText('SEK'));
    expect(screen.getByTestId('currency')).toHaveTextContent('SEK');
    body = ratesBody(['USD']);
    await act(() => client.refetchQueries({ queryKey: queryKeys.exchangeRates }));
    await waitFor(() => { expect(screen.getByTestId('currency')).toHaveTextContent('EUR'); });
  });
});
