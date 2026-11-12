// Casos de uso de simulaciones (plan §7). El precio sale solo de calculateQuote con `users` y el
// país guardado del cliente (RF1–RF3); el alta va en una transacción (CA3). Si la regla rechaza
// el país guardado, se lanza un Error genérico que el errorHandler convierte en 500 (RF12).
// getById devuelve `undefined` si no existe: el controller lo traduce a SIMULATION_NOT_FOUND (T7).
import { calculateQuote } from '@saas-o-matic/shared';
import type { Customer, Simulation, SimulationInput } from '@saas-o-matic/shared';
import { customerNotFound } from '../http/errors';
import type { CustomersRepository } from '../repositories/customers.repository';
import type { SimulationsRepository } from '../repositories/simulations.repository';
import type { Clock } from './customers.service';

export interface SimulationList {
  items: Simulation[];
}

export interface SimulationsService {
  /** 404 CUSTOMER_NOT_FOUND si el cliente no existe (RF11). */
  create(input: SimulationInput): Simulation;
  /** `undefined` si no existe (RF15). */
  getById(id: number): Simulation | undefined;
  /** 404 CUSTOMER_NOT_FOUND si el cliente no existe (RF17). */
  listByCustomer(customerId: number): SimulationList;
}

export interface SimulationsServiceDeps {
  customers: CustomersRepository;
  simulations: SimulationsRepository;
  now: Clock;
  /** Ejecuta `fn` en una transacción (db.transaction de better-sqlite3). */
  runInTransaction: <T>(fn: () => T) => T;
}

export function createSimulationsService(deps: SimulationsServiceDeps): SimulationsService {
  function requireCustomer(id: number): Customer {
    const customer = deps.customers.findById(id);
    if (customer === undefined) throw customerNotFound(id);
    return customer;
  }

  function createUnsafe(input: SimulationInput): Simulation {
    const customer = requireCustomer(input.customerId);
    const result = calculateQuote({ users: input.users, country: customer.country });
    if (!result.ok) {
      throw new Error(`calculateQuote rechazó el país guardado del cliente ${String(customer.id)}.`);
    }
    return deps.simulations.insert({
      ...result.value,
      customerId: customer.id,
      storage: input.storage,
      apiCalls: input.apiCalls,
      createdAt: deps.now().toISOString(),
    });
  }

  return {
    create: (input) => deps.runInTransaction(() => createUnsafe(input)),
    getById: (id) => deps.simulations.findById(id),
    listByCustomer(customerId) {
      requireCustomer(customerId);
      return { items: deps.simulations.listByCustomer(customerId) };
    },
  };
}
