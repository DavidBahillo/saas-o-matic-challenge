// Service de simulaciones (plan §7, RF14): validar -> cliente -> precio en euros -> tipo -> convertir
// -> guardar. Proveedor de tipos falso: ningún test llama a una API real.
import { calculateQuote, convertQuote } from '@saas-o-matic/shared';
import type { SimulationInput } from '@saas-o-matic/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Database from 'better-sqlite3';
import { openDatabase } from '../db/connection';
import { HttpError } from '../http/errors';
import { createCustomersRepository } from '../repositories/customers.repository';
import { createSimulationsRepository } from '../repositories/simulations.repository';
import { migrate } from '../repositories/schema';
import { createExchangeRatesService } from './exchange-rates.service';
import { createSimulationsService } from './simulations.service';
import type { SimulationsService } from './simulations.service';

const NOW = new Date('2026-03-01T10:00:00.000Z');
const RATE_AT = new Date('2026-03-01T09:00:00.000Z');
let db: Database.Database;
let service: SimulationsService;
let transactions: number;
let providerCalls: string[];
let rateAnswer: string | Error;
let inTransaction: boolean;
let fetchedInTransaction: boolean;

function insertCustomer(country: string, plan = 'growth', taxId = 'B12345674'): number {
  const sql = `INSERT INTO customers (company_name, company_name_search, tax_id, tax_id_type,
    email, country, plan, created_at) VALUES ('Acme', 'acme', ?, 'CIF', 'a@acme.es', ?, ?, ?)`;
  return Number(db.prepare(sql).run(taxId, country, plan, NOW.toISOString()).lastInsertRowid);
}

function count(): number {
  return db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM simulations').get()?.n ?? -1;
}

function input(customerId: number, users: number, extra: Partial<SimulationInput> = {}): SimulationInput {
  return { customerId, users, storage: 0, apiCalls: 0, currency: 'EUR', ...extra };
}

function expectedQuote(users: number, country: string) {
  const result = calculateQuote({ users, country });
  if (!result.ok) throw new Error('calculateQuote falló en el test');
  return result.value;
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  transactions = 0;
  providerCalls = [];
  inTransaction = false;
  fetchedInTransaction = false;
  rateAnswer = '1.1';
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const rates = createExchangeRatesService({
    provider: {
      fetchRates() {
        providerCalls.push('fetch');
        fetchedInTransaction = inTransaction;
        return rateAnswer instanceof Error ? Promise.reject(rateAnswer) : Promise.resolve({ USD: rateAnswer });
      },
    },
    now: () => RATE_AT,
  });
  service = createSimulationsService({
    customers: createCustomersRepository(db),
    simulations: createSimulationsRepository(db),
    rates,
    now: () => NOW,
    runInTransaction: (fn) => {
      transactions += 1;
      inTransaction = true;
      try {
        return db.transaction(fn)();
      } finally {
        inTransaction = false;
      }
    },
  });
});

afterEach(() => {
  db.close();
  vi.restoreAllMocks();
});

describe('simulations.service · create en EUR (RF1, RF2)', () => {
  it('los importes son toEqual a calculateQuote y no llama al proveedor (RF2, CA2)', async () => {
    const id = insertCustomer('PT');
    const sim = await service.create(input(id, 15));
    const quote = expectedQuote(15, 'PT');
    expect(sim).toEqual({
      ...quote,
      id: sim.id, customerId: id, storage: 0, apiCalls: 0, createdAt: NOW.toISOString(),
      currency: 'EUR', exchangeRate: '1.000000', exchangeRateAt: NOW.toISOString(),
      convertedBaseCents: quote.baseCents, convertedVatCents: quote.vatCents, convertedTotalCents: quote.totalCents,
    });
    expect(providerCalls).toEqual([]);
    expect(service.getById(sim.id)).toEqual(sim);
  });

  it('plan, storage y apiCalls no cambian los importes (RF3)', async () => {
    const a = insertCustomer('ES', 'starter', 'B12345674');
    const b = insertCustomer('ES', 'enterprise', 'A58818501');
    const s1 = await service.create(input(a, 15));
    const s2 = await service.create(input(b, 15, { storage: 1_000_000, apiCalls: 1_000_000 }));
    const pick = (s: typeof s1) => [s.tiers, s.baseCents, s.vatCents, s.totalCents];
    expect(pick(s2)).toEqual(pick(s1));
    expect(s1.totalCents).toBe(16940);
  });

  it('el alta va dentro de una transacción', async () => {
    await service.create(input(insertCustomer('ES'), 1));
    expect(transactions).toBe(1);
  });
});

describe('simulations.service · create en otra divisa (RF1, RF5, RF17)', () => {
  it('USD convierte con convertQuote y guarda el par (tipo, instante) recibido', async () => {
    const id = insertCustomer('ES');
    const sim = await service.create(input(id, 15, { currency: 'USD' }));
    expect(sim).toMatchObject({
      currency: 'USD',
      exchangeRate: '1.100000',
      exchangeRateAt: RATE_AT.toISOString(),
      createdAt: NOW.toISOString(),
      baseCents: 14000,
      vatCents: 2940,
      totalCents: 16940,
      ...convertQuote({ baseCents: 14000, vatCents: 2940 }, 1_100_000),
    });
    expect(sim.convertedTotalCents).toBe(18634);
    expect(providerCalls).toEqual(['fetch']);
  });

});

describe('simulations.service · orden de comprobación (RF14, CA4)', () => {
  it('un cliente inexistente da CUSTOMER_NOT_FOUND sin llamar al proveedor ni insertar', async () => {
    const error = await rejection(service.create(input(999, 5, { currency: 'USD' })));
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 404, code: 'CUSTOMER_NOT_FOUND' });
    expect(providerCalls).toEqual([]);
    expect(count()).toBe(0);
  });

  it('un cliente con país XX lanza un error no HTTP, antes de pedir el tipo, sin insertar (RF12 de la 003)', async () => {
    const id = insertCustomer('XX');
    const error = await rejection(service.create(input(id, 5, { currency: 'USD' })));
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpError);
    expect(providerCalls).toEqual([]);
    expect(count()).toBe(0);
  });

  it('si falla el tipo, da EXCHANGE_RATE_UNAVAILABLE y no inserta', async () => {
    rateAnswer = new Error('caída');
    const error = await rejection(service.create(input(insertCustomer('ES'), 5, { currency: 'USD' })));
    expect(error).toMatchObject({ status: 500, code: 'EXCHANGE_RATE_UNAVAILABLE' });
    expect(count()).toBe(0);
    expect(transactions).toBe(0);
  });

  it('el await del tipo queda fuera de la transacción', async () => {
    await service.create(input(insertCustomer('ES'), 1, { currency: 'USD' }));
    expect(fetchedInTransaction).toBe(false);
  });
});

describe('simulations.service · lecturas', () => {
  it('getById de un id inexistente devuelve undefined (RF15)', () => {
    expect(service.getById(424242)).toBeUndefined();
  });

  it('listByCustomer devuelve items y da CUSTOMER_NOT_FOUND si no existe (RF16, RF17)', async () => {
    const id = insertCustomer('ES');
    expect(service.listByCustomer(id)).toEqual({ items: [] });
    const sim = await service.create(input(id, 3));
    expect(service.listByCustomer(id)).toEqual({ items: [sim] });
    expect(() => service.listByCustomer(999)).toThrow(expect.objectContaining({ code: 'CUSTOMER_NOT_FOUND' }));
  });
});
