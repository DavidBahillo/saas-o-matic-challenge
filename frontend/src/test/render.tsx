// renderApp: la aplicación completa con QueryClient sin reintentos y MemoryRouter, con fetch sustituido.
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { App } from '../App';
import { createQueryClient } from '../api/query-client';
import { RATES_OK, customerList } from './fixtures';
import { mockFetch } from './mock-fetch';
import type { FetchMock, MockHandler } from './mock-fetch';

export interface RenderAppOptions {
  route?: string;
  /** Rutas "GET /api/..." del fetch sustituido. Por defecto /exchange-rates responde 200 y /customers una lista vacía. */
  routes?: Record<string, MockHandler>;
  /** true con vi.useFakeTimers: user-event sin esperas propias (delay null). */
  fakeTimers?: boolean;
}

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

export function renderApp({ route = '/', routes = {}, fakeTimers = false }: RenderAppOptions = {}) {
  const fetchMock: FetchMock = mockFetch({ 'GET /api/exchange-rates': RATES_OK, 'GET /api/customers': customerList([]), ...routes });
  const user = userEvent.setup(fakeTimers ? { delay: null } : {});
  const view = render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, user, fetchMock };
}
