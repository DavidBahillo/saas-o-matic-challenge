// Datos de prueba con los literales de la spec y del plan §5.
import type { Customer, Simulation } from '@saas-o-matic/shared';
import type { MockReply } from './mock-fetch';

export const ACME: Customer = {
  id: 7,
  companyName: 'Acme Ibérica SL',
  taxId: 'B12345674',
  taxIdType: 'CIF',
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth',
  createdAt: '2026-11-12T10:00:00.000Z',
  simulationCount: 2,
};

export const SIMULATION_USD: Simulation = {
  id: 2,
  customerId: 7,
  users: 15,
  storage: 0,
  apiCalls: 0,
  tiers: [
    { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 10, subtotalCents: 10000 },
    { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 5, subtotalCents: 4000 },
    { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
  ],
  baseCents: 14000,
  country: 'ES',
  vatRatePercent: 21,
  vatCents: 2940,
  totalCents: 16940,
  currency: 'USD',
  exchangeRate: '1.100000',
  exchangeRateAt: '2026-11-13T09:00:00.000Z',
  convertedBaseCents: 15400,
  convertedVatCents: 3234,
  convertedTotalCents: 18634,
  createdAt: '2026-11-13T09:30:00.000Z',
};

export const RATES_BODY = {
  items: [
    { currency: 'USD', exchangeRate: '1.100000', exchangeRateAt: '2026-11-13T09:30:00.000Z' },
    { currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: '2026-11-13T09:00:00.000Z' },
  ],
};

export const RATES_OK: MockReply = { body: RATES_BODY };

export const RATES_UNAVAILABLE: MockReply = {
  status: 500,
  body: { error: { code: 'EXCHANGE_RATE_UNAVAILABLE', message: 'Tipos de cambio no disponibles.' } },
};

export const CUSTOMER_LIST_BODY = { items: [ACME], total: 1 };

export const makeCustomer = (overrides: Partial<Customer>): Customer => ({ ...ACME, ...overrides });

export const customerList = (items: Customer[], total = items.length): MockReply => ({ body: { items, total } });

export const apiError = (status: number, code: string, message: string, details?: unknown): MockReply => ({
  status,
  body: { error: { code, message, ...(details === undefined ? {} : { details }) } },
});

/** Promesa que nunca se resuelve: mantiene una consulta en carga. */
export const NEVER: Promise<never> = new Promise(() => undefined);

/** Tipos ilustrativos de la spec 007 (USD, GBP, CHF y SEK), todos con la misma hora. */
const ILLUSTRATIVE: Record<string, string> = { USD: '1.100000', GBP: '0.850000', CHF: '0.950000', SEK: '11.500000' };

export const ratesBody = (codes: readonly string[] = ['USD', 'GBP', 'CHF', 'SEK']) => ({
  items: codes.map((currency) => ({
    currency,
    exchangeRate: ILLUSTRATIVE[currency] ?? '2.000000',
    exchangeRateAt: '2026-11-13T09:00:00.000Z',
  })),
});

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}
