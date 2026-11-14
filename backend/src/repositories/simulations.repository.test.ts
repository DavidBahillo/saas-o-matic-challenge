// Tests del repositorio de simulaciones (T5): insert/findById con toEqual, listByCustomer
// ordenado por created_at DESC, id DESC, integridad de FK (RF13) y valores congelados (RF20).
import { formatRate } from '@saas-o-matic/shared';
import type { Simulation } from '@saas-o-matic/shared';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db/connection';
import { createCustomersRepository } from './customers.repository';
import { createSimulationsRepository } from './simulations.repository';
import type { SimulationInsert, SimulationsRepository } from './simulations.repository';
import { migrate } from './schema';

const T0 = '2026-11-12T10:00:00.000Z';
const T1 = '2026-11-12T11:00:00.000Z';

const SIM: SimulationInsert = {
  customerId: 1,
  users: 15,
  storage: 50,
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
  currency: 'EUR',
  exchangeRateMicros: 1_000_000,
  exchangeRateAt: T0,
  convertedBaseCents: 14000,
  convertedVatCents: 2940,
  convertedTotalCents: 16940,
  createdAt: T0,
};

/** Lo que devuelve el repositorio para un insert: el tipo pasa a texto de 6 decimales. */
function stored(insert: SimulationInsert, id: number): Simulation {
  const { exchangeRateMicros, ...rest } = insert;
  return { ...rest, id, exchangeRate: formatRate(exchangeRateMicros) };
}

const USD_SIM: SimulationInsert = {
  ...SIM,
  currency: 'USD',
  exchangeRateMicros: 1_100_000,
  exchangeRateAt: T1,
  convertedBaseCents: 15400,
  convertedVatCents: 3234,
  convertedTotalCents: 18634,
};

let db: Database.Database;
let repo: SimulationsRepository;

function addCustomer(taxId: string): number {
  return createCustomersRepository(db).insert({
    companyName: `Cliente ${taxId}`,
    companyNameSearch: `cliente ${taxId}`,
    taxId,
    taxIdType: 'OTHER',
    email: 'a@b.es',
    country: 'ES',
    plan: 'growth',
    createdAt: T0,
  }).id;
}

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  repo = createSimulationsRepository(db);
  addCustomer('X1');
});

afterEach(() => {
  db.close();
});

describe('insert y findById', () => {
  it('insert devuelve la simulación con id; findById es toEqual', () => {
    const created = repo.insert(SIM);
    expect(created).toEqual(stored(SIM, 1));
    expect(repo.findById(created.id)).toEqual(stored(SIM, 1));
  });

  it('el tramo 3 conserva to: null y no aparece -0', () => {
    const found = repo.findById(repo.insert(SIM).id);
    expect(found?.tiers[2]?.to).toBeNull();
    const tierValues: unknown[] = found === undefined ? [] : found.tiers.flatMap((t): unknown[] => [t.from, t.to, t.unitPriceCents, t.billedUsers, t.subtotalCents]);
    for (const v of [...tierValues, found?.storage, found?.apiCalls]) {
      if (typeof v === 'number') expect(Object.is(v, -0)).toBe(false);
    }
  });

  it('findById de un id inexistente da undefined', () => {
    expect(repo.findById(424242)).toBeUndefined();
  });

  it('una fila con base_cents 99900 se lee con 99900', () => {
    const id = repo.insert({ ...SIM, baseCents: 99900 }).id;
    expect(repo.findById(id)?.baseCents).toBe(99900);
  });

  it('insert y findById con USD son toEqual, con tipo en texto y sin -0 (RF8, RF19)', () => {
    const created = repo.insert(USD_SIM);
    expect(created).toEqual(stored(USD_SIM, 1));
    expect(created.exchangeRate).toBe('1.100000');
    const found = repo.findById(created.id);
    expect(found).toEqual(stored(USD_SIM, 1));
    for (const v of [found?.convertedBaseCents, found?.convertedVatCents, found?.convertedTotalCents]) {
      expect(Object.is(v, -0)).toBe(false);
    }
  });

  it('una fila con converted_base_cents 99900 se lee con 99900 (congelación)', () => {
    const id = repo.insert({ ...USD_SIM, convertedBaseCents: 99900 }).id;
    expect(repo.findById(id)?.convertedBaseCents).toBe(99900);
  });

  it('un tipo fuera de rango lo rechaza el CHECK de la BD', () => {
    expect(() => repo.insert({ ...USD_SIM, exchangeRateMicros: 9_999 })).toThrow(
      expect.objectContaining({ code: 'SQLITE_CONSTRAINT_CHECK' }),
    );
  });

  it('un customer_id inexistente lanza SQLITE_CONSTRAINT_FOREIGNKEY', () => {
    expect(() => repo.insert({ ...SIM, customerId: 999 })).toThrow(
      expect.objectContaining({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' }),
    );
  });

  it('migrate dos veces conserva clientes y simulaciones', () => {
    repo.insert(SIM);
    migrate(db);
    migrate(db);
    expect(repo.findById(1)).toEqual(stored(SIM, 1));
    expect(createCustomersRepository(db).findById(1)).toBeDefined();
  });
});

describe('borrado de clientes (CASCADE, 009)', () => {
  it('borrar un cliente con simulaciones borra también sus simulaciones', () => {
    repo.insert(SIM);
    expect(db.prepare('DELETE FROM customers WHERE id = 1').run().changes).toBe(1);
    expect(repo.findById(1)).toBeUndefined();
  });

  it('un cliente sin simulaciones se borra', () => {
    expect(db.prepare('DELETE FROM customers WHERE id = 1').run().changes).toBe(1);
  });
});

describe('listByCustomer', () => {
  it('ordena por created_at DESC y, con empate, id DESC', () => {
    repo.insert({ ...SIM, createdAt: T0 }); // 1
    repo.insert({ ...SIM, createdAt: T1 }); // 2
    repo.insert({ ...SIM, createdAt: T0 }); // 3
    repo.insert({ ...SIM, createdAt: T0 }); // 4
    repo.insert({ ...SIM, createdAt: T0 }); // 5
    expect(repo.listByCustomer(1).map((s) => s.id)).toEqual([2, 5, 4, 3, 1]);
  });

  it('no mezcla clientes y da [] sin simulaciones', () => {
    const other = addCustomer('X2');
    repo.insert(SIM);
    repo.insert({ ...SIM, customerId: other });
    expect(repo.listByCustomer(1).map((s) => s.customerId)).toEqual([1]);
    expect(repo.listByCustomer(other).map((s) => s.id)).toEqual([2]);
    expect(repo.listByCustomer(addCustomer('X3'))).toEqual([]);
  });
});
