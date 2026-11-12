// Service de simulaciones (T6, plan §7): precio solo de calculateQuote con el país del cliente,
// alta transaccional, 404 del cliente y error (500) sin insertar si el país guardado falla.
import { calculateQuote } from '@saas-o-matic/shared';
import type { SimulationInput } from '@saas-o-matic/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openDatabase } from '../db/connection';
import { HttpError } from '../http/errors';
import { createCustomersRepository } from '../repositories/customers.repository';
import { createSimulationsRepository } from '../repositories/simulations.repository';
import { migrate } from '../repositories/schema';
import { createSimulationsService } from './simulations.service';
import type { SimulationsService } from './simulations.service';

const NOW = new Date('2026-03-01T10:00:00.000Z');
let db: Database.Database;
let service: SimulationsService;
let transactions: number;

function insertCustomer(country: string, plan = 'growth', taxId = 'B12345674'): number {
  const sql = `INSERT INTO customers (company_name, company_name_search, tax_id, tax_id_type,
    email, country, plan, created_at) VALUES ('Acme', 'acme', ?, 'CIF', 'a@acme.es', ?, ?, ?)`;
  return Number(db.prepare(sql).run(taxId, country, plan, NOW.toISOString()).lastInsertRowid);
}

function count(): number {
  return db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM simulations').get()?.n ?? -1;
}

function input(customerId: number, users: number, extra: Partial<SimulationInput> = {}): SimulationInput {
  return { customerId, users, storage: 0, apiCalls: 0, ...extra };
}

function expectedQuote(users: number, country: string) {
  const result = calculateQuote({ users, country });
  if (!result.ok) throw new Error('calculateQuote falló en el test');
  return result.value;
}

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  transactions = 0;
  service = createSimulationsService({
    customers: createCustomersRepository(db),
    simulations: createSimulationsRepository(db),
    now: () => NOW,
    runInTransaction: (fn) => {
      transactions += 1;
      return db.transaction(fn)();
    },
  });
});

afterEach(() => {
  db.close();
});

describe('simulations.service · create', () => {
  it('los importes son toEqual a calculateQuote con el país del cliente (RF1, RF2, CA2)', () => {
    const id = insertCustomer('PT');
    const sim = service.create(input(id, 15));
    expect(sim).toEqual({
      ...expectedQuote(15, 'PT'),
      id: sim.id, customerId: id, storage: 0, apiCalls: 0, createdAt: NOW.toISOString(),
    });
    expect(sim.createdAt).toBe('2026-03-01T10:00:00.000Z');
    expect(service.getById(sim.id)).toEqual(sim);
  });

  it('plan, storage y apiCalls no cambian los importes (RF3)', () => {
    const a = insertCustomer('ES', 'starter', 'B12345674');
    const b = insertCustomer('ES', 'enterprise', 'A58818501');
    const s1 = service.create(input(a, 15));
    const s2 = service.create(input(b, 15, { storage: 1_000_000, apiCalls: 1_000_000 }));
    const pick = (s: typeof s1) => [s.tiers, s.baseCents, s.vatCents, s.totalCents];
    expect(pick(s2)).toEqual(pick(s1));
    expect(s1.totalCents).toBe(16940);
  });

  it('un cliente inexistente da CUSTOMER_NOT_FOUND sin insertar (RF11)', () => {
    expect(() => service.create(input(999, 5))).toThrow(HttpError);
    try { service.create(input(999, 5)); } catch (error) {
      expect(error).toMatchObject({ status: 404, code: 'CUSTOMER_NOT_FOUND' });
    }
    expect(count()).toBe(0);
  });

  it('un cliente con país XX lanza un error no HTTP y no inserta (RF12)', () => {
    const id = insertCustomer('XX');
    let thrown: unknown;
    try { service.create(input(id, 5)); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).not.toBeInstanceOf(HttpError);
    expect(count()).toBe(0);
  });

  it('el alta va dentro de una transacción', () => {
    service.create(input(insertCustomer('ES'), 1));
    expect(transactions).toBe(1);
  });
});

describe('simulations.service · lecturas', () => {
  it('getById de un id inexistente devuelve undefined (SIMULATION_NOT_FOUND en T7, RF15)', () => {
    expect(service.getById(424242)).toBeUndefined();
  });

  it('listByCustomer devuelve items y da CUSTOMER_NOT_FOUND si no existe (RF16, RF17)', () => {
    const id = insertCustomer('ES');
    expect(service.listByCustomer(id)).toEqual({ items: [] });
    const sim = service.create(input(id, 3));
    expect(service.listByCustomer(id)).toEqual({ items: [sim] });
    expect(() => service.listByCustomer(999)).toThrow(expect.objectContaining({ code: 'CUSTOMER_NOT_FOUND' }));
  });
});
