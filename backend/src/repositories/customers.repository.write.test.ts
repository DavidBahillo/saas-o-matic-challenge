// Repositorio de clientes, spec 009: update (RF10, RF13, RF14) y deleteWithSimulations (RF20, RF21).
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { toSearchKey } from '@saas-o-matic/shared';
import type { NewCustomer } from '@saas-o-matic/shared';
import { openDatabase } from '../db/connection';
import { DuplicateCustomerError, createCustomersRepository } from './customers.repository';
import type { CustomerInsert, CustomerUpdate, CustomersRepository } from './customers.repository';
import { migrate } from './schema';

const CREATED_AT = '2026-11-12T10:00:00.000Z';

const ACME: NewCustomer = {
  companyName: 'Acme Ibérica SL',
  taxId: 'B12345674',
  taxIdType: 'CIF',
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth',
};

function toInsert(customer: NewCustomer): CustomerInsert {
  return { ...customer, companyNameSearch: toSearchKey(customer.companyName), createdAt: CREATED_AT };
}

function toUpdate(customer: NewCustomer): CustomerUpdate {
  return { ...customer, companyNameSearch: toSearchKey(customer.companyName) };
}

function addSimulations(db: Database.Database, customerId: number, n: number): void {
  const stmt = db.prepare(`INSERT INTO simulations (customer_id, users, storage, api_calls, tiers_json,
    base_cents, country, vat_rate_percent, vat_cents, total_cents, created_at)
    VALUES (?, 1, 0, 0, '[]', 1000, 'ES', 21, 210, 1210, ?)`);
  for (let i = 0; i < n; i += 1) stmt.run(customerId, CREATED_AT);
}

function count(db: Database.Database, table: string): number {
  return db.prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n ?? -1;
}

let db: Database.Database;
let repo: CustomersRepository;

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  repo = createCustomersRepository(db);
});

afterEach(() => {
  db.close();
});

describe('update', () => {
  it('cambia los campos, conserva id y fecha de alta y recalcula la clave de búsqueda', () => {
    const created = repo.insert(toInsert(ACME));
    addSimulations(db, created.id, 2);
    const changed = { ...ACME, companyName: 'Zeta Iberia SL', plan: 'enterprise', email: 'z@zeta.es' } as const;
    const updated = repo.update(created.id, toUpdate(changed));
    expect(updated).toEqual({ ...changed, id: created.id, createdAt: CREATED_AT, simulationCount: 2 });
    expect(repo.findById(created.id)).toEqual(updated);
    expect(repo.search({ nameKey: 'zeta', taxIdFragment: '' })).toHaveLength(1);
    expect(repo.search({ nameKey: 'acme', taxIdFragment: '' })).toHaveLength(0);
  });

  it('devuelve undefined si el cliente no existe', () => {
    expect(repo.update(99, toUpdate(ACME))).toBeUndefined();
  });

  it('guardar los mismos (país, NIF) no es un duplicado de sí mismo', () => {
    const created = repo.insert(toInsert(ACME));
    expect(repo.update(created.id, toUpdate(ACME))).toMatchObject({ id: created.id, taxId: 'B12345674' });
  });

  it('el (país, NIF) de otro cliente lanza DuplicateCustomerError y no cambia nada', () => {
    const first = repo.insert(toInsert(ACME));
    const second = repo.insert(toInsert({ ...ACME, companyName: 'Otra SL', taxId: 'A58818501' }));
    expect(() => repo.update(second.id, toUpdate({ ...ACME, companyName: 'Otra SL' }))).toThrow(DuplicateCustomerError);
    expect(repo.findById(second.id)).toEqual(second);
    expect(repo.findById(first.id)).toEqual(first);
  });
});

describe('deleteWithSimulations', () => {
  it.each([0, 1, 14])('borra el cliente y sus %d simulaciones y devuelve el recuento', (n) => {
    const created = repo.insert(toInsert(ACME));
    const other = repo.insert(toInsert({ ...ACME, companyName: 'Otra', taxId: 'A58818501' }));
    addSimulations(db, created.id, n);
    addSimulations(db, other.id, 3);
    expect(repo.deleteWithSimulations(created.id)).toEqual({ deletedSimulations: n });
    expect(repo.findById(created.id)).toBeUndefined();
    expect(count(db, 'simulations')).toBe(3);
    expect(repo.findById(other.id)?.simulationCount).toBe(3);
  });

  it('devuelve undefined si el cliente no existe', () => {
    expect(repo.deleteWithSimulations(99)).toBeUndefined();
  });

  it('es atómico: si algo falla, cliente y simulaciones siguen intactos', () => {
    const created = repo.insert(toInsert(ACME));
    addSimulations(db, created.id, 3);
    db.exec(`CREATE TRIGGER boom AFTER DELETE ON customers BEGIN SELECT RAISE(ABORT, 'boom'); END`);
    expect(() => repo.deleteWithSimulations(created.id)).toThrow(/boom/);
    expect(repo.findById(created.id)?.simulationCount).toBe(3);
    expect(count(db, 'simulations')).toBe(3);
    expect(db.inTransaction).toBe(false);
  });

  it('permite volver a dar de alta el mismo (país, NIF)', () => {
    const created = repo.insert(toInsert(ACME));
    repo.deleteWithSimulations(created.id);
    expect(repo.insert(toInsert(ACME)).taxId).toBe('B12345674');
  });
});
