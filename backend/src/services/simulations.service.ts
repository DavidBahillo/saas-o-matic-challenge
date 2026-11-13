// Casos de uso de simulaciones (plan §7). Orden del alta (RF14): cliente -> precio en euros con
// calculateQuote -> tipo de cambio (solo si la divisa no es EUR) -> convertir -> guardar. El `await`
// del tipo va ANTES de la transacción síncrona de better-sqlite3. Si la regla rechaza el país
// guardado, se lanza un Error genérico que el errorHandler convierte en 500 (RF12 de la 003).
// getById devuelve `undefined` si no existe: el controller lo traduce a SIMULATION_NOT_FOUND.
import { EUR_MICROS, calculateQuote, convertQuote } from '@saas-o-matic/shared';
import type { Customer, Quote, RateMicros, Simulation, SimulationInput } from '@saas-o-matic/shared';
import { customerNotFound } from '../http/errors';
import type { CustomersRepository } from '../repositories/customers.repository';
import type { SimulationInsert, SimulationsRepository } from '../repositories/simulations.repository';
import type { Clock } from './customers.service';
import type { ExchangeRatesService } from './exchange-rates.service';

export interface SimulationList {
  items: Simulation[];
}

export interface SimulationsService {
  /** 404 CUSTOMER_NOT_FOUND (RF11); 500 EXCHANGE_RATE_UNAVAILABLE si falla el tipo (RF16). */
  create(input: SimulationInput): Promise<Simulation>;
  /** `undefined` si no existe (RF15). */
  getById(id: number): Simulation | undefined;
  /** 404 CUSTOMER_NOT_FOUND si el cliente no existe (RF17). */
  listByCustomer(customerId: number): SimulationList;
}

export interface SimulationsServiceDeps {
  customers: CustomersRepository;
  simulations: SimulationsRepository;
  rates: ExchangeRatesService;
  now: Clock;
  /** Ejecuta `fn` en una transacción síncrona (db.transaction de better-sqlite3). */
  runInTransaction: <T>(fn: () => T) => T;
}

/** Tipo (micro-unidades) e instante de obtención que se congelan en la simulación. */
interface FrozenRate {
  micros: RateMicros;
  at: string;
}

/** Fila completa a guardar: precio en euros, tipo y fecha congelados e importes convertidos. */
function frozenRow(
  input: SimulationInput,
  customer: Customer,
  quote: Quote,
  rate: FrozenRate,
  createdAt: string,
): SimulationInsert {
  return {
    ...quote,
    customerId: customer.id,
    storage: input.storage,
    apiCalls: input.apiCalls,
    currency: input.currency,
    exchangeRateMicros: rate.micros,
    exchangeRateAt: input.currency === 'EUR' ? createdAt : rate.at,
    ...convertQuote(quote, rate.micros),
    createdAt,
  };
}

export function createSimulationsService(deps: SimulationsServiceDeps): SimulationsService {
  function requireCustomer(id: number): Customer {
    const customer = deps.customers.findById(id);
    if (customer === undefined) throw customerNotFound(id);
    return customer;
  }

  function priceInEuros(input: SimulationInput, customer: Customer): Quote {
    const result = calculateQuote({ users: input.users, country: customer.country });
    if (!result.ok) {
      throw new Error(`calculateQuote rechazó el país guardado del cliente ${String(customer.id)}.`);
    }
    return result.value;
  }

  async function frozenRate(currency: SimulationInput['currency']): Promise<FrozenRate> {
    if (currency === 'EUR') return { micros: EUR_MICROS, at: deps.now().toISOString() };
    const pair = await deps.rates.getRate(currency);
    return { micros: pair.micros, at: pair.at.toISOString() };
  }

  async function create(input: SimulationInput): Promise<Simulation> {
    const customer = requireCustomer(input.customerId);
    const quote = priceInEuros(input, customer);
    const rate = await frozenRate(input.currency);
    const createdAt = deps.now().toISOString();
    const row = frozenRow(input, customer, quote, rate, createdAt);
    return deps.runInTransaction(() => deps.simulations.insert(row));
  }

  return {
    create,
    getById: (id) => deps.simulations.findById(id),
    listByCustomer(customerId) {
      requireCustomer(customerId);
      return { items: deps.simulations.listByCustomer(customerId) };
    },
  };
}
