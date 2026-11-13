// App de pruebas para los tests de integración HTTP (plan §9): BD :memory:, esquema migrado y
// reloj fijo. `countCustomers` comprueba que una petición rechazada no deja filas (CA5).
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { openDatabase } from '../../src/db/connection';
import { createCustomersRepository } from '../../src/repositories/customers.repository';
import type { CustomersRepository } from '../../src/repositories/customers.repository';
import { migrate } from '../../src/repositories/schema';
import { createFakeRates } from './fake-rates';
import type { FakeRates } from './fake-rates';

export const FIXED_NOW = '2026-11-12T10:00:00.000Z';

export interface TestApp {
  app: Express;
  db: Database.Database;
  repository: CustomersRepository;
  /** Proveedor de tipos falso y reloj movible (004). */
  rates: FakeRates;
  setNow(date: Date): void;
  countCustomers(): number;
  close(): void;
}

export interface TestAppOptions {
  /** Envuelve el repositorio real, por ejemplo para que lance un error inesperado (RF31). */
  wrapRepository?: (real: CustomersRepository) => CustomersRepository;
}

export function createTestApp(options: TestAppOptions = {}): TestApp {
  const db = openDatabase(':memory:');
  migrate(db);
  const real = createCustomersRepository(db);
  const repository = options.wrapRepository?.(real) ?? real;
  const rates = createFakeRates();
  let current = new Date(FIXED_NOW);
  const app = createApp({ db, repository, now: () => current, rateProvider: rates.provider });
  return {
    app,
    db,
    repository: real,
    rates,
    setNow: (date) => {
      current = date;
    },
    countCustomers: () => real.search().length,
    close: () => {
      db.close();
    },
  };
}

/** Cuerpo válido del ejemplo del contrato (POST /customers). */
export const CONTRACT_REQUEST = {
  companyName: 'Acme Ibérica SL',
  taxId: 'b-1234567-4',
  email: '  Compras@Acme.ES ',
  country: 'es',
  plan: 'growth',
} as const;

/** Respuesta 201 del contrato para CONTRACT_REQUEST. */
export const CONTRACT_RESPONSE = {
  id: 1,
  companyName: 'Acme Ibérica SL',
  taxId: 'B12345674',
  taxIdType: 'CIF',
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth',
  createdAt: FIXED_NOW,
} as const;

export const VALIDATION_MESSAGE = 'La petición contiene campos no válidos.';
