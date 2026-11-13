// RF14, RF15: la divisa del país se aplica una sola vez por visita (ready -> unavailable -> ready no la reaplica).
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '../api/query-client';
import { queryKeys } from '../api/query-keys';
import { RATES_UNAVAILABLE, ratesBody } from '../test/fixtures';
import type { MockOutcome } from '../test/mock-fetch';
import { mockFetch } from '../test/mock-fetch';
import { CurrencyProvider, useCurrency } from './currency-context';
import { useCurrencyPreselection } from './use-currency-preselection';

function Probe() {
  const ready = useCurrencyPreselection('US');
  const { currency, status } = useCurrency();
  return <output data-testid="out">{`${String(ready)}|${currency}|${status}`}</output>;
}

describe('useCurrencyPreselection', () => {
  it('ready -> unavailable -> ready no vuelve a aplicar USD', async () => {
    let reply: MockOutcome = { body: ratesBody() };
    mockFetch({ 'GET /api/exchange-rates': () => reply });
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <CurrencyProvider><Probe /></CurrencyProvider>
      </QueryClientProvider>,
    );
    const out = () => screen.getByTestId('out');
    await waitFor(() => { expect(out()).toHaveTextContent('true|USD|ready'); });
    reply = RATES_UNAVAILABLE;
    await act(() => client.refetchQueries({ queryKey: queryKeys.exchangeRates }));
    await waitFor(() => { expect(out()).toHaveTextContent('true|EUR|unavailable'); });
    reply = { body: ratesBody() };
    await act(() => client.refetchQueries({ queryKey: queryKeys.exchangeRates }));
    await waitFor(() => { expect(out()).toHaveTextContent('true|EUR|ready'); });
  });
});
