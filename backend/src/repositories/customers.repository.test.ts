// Tests del repositorio de clientes con SQLite en memoria (T7): migrate, insert/find,
// unicidad (país, tax ID) → DuplicateCustomerError (RF21) y filtro de búsqueda con instr (RF23).
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { toSearchKey } from '@saas-o-matic/shared';
import type { NewCustomer } from '@saas-o-matic/shared';
import { openDatabase } from '../db/connection';
import { DuplicateCustomerError, createCustomersRepository } from './customers.repository';
import type { CustomerInsert, CustomersRepository } from './customers.repository';
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

function named(companyName: string, taxId: string): CustomerInsert {
  return toInsert({ ...ACME, companyName, taxId });
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

describe('migrate', () => {
  it('es idempotente y no borra datos', () => {
    repo.insert(toInsert(ACME));
    expect(() => {
      migrate(db);
      migrate(db);
    }).not.toThrow();
    expect(repo.search()).toHaveLength(1);
  });
});

describe('insert y find', () => {
  it('insert devuelve el Customer con id y createdAt', () => {
    expect(repo.insert(toInsert(ACME))).toEqual({ ...ACME, id: 1, createdAt: CREATED_AT, simulationCount: 0 });
  });

  it('findById devuelve el mismo Customer que insert', () => {
    const created = repo.insert(toInsert(ACME));
    expect(repo.findById(created.id)).toEqual(created);
  });

  it('los ids son autoincrementales', () => {
    const a = repo.insert(named('Alfa SL', 'A11111111'));
    const b = repo.insert(named('Beta SL', 'B22222222'));
    expect(b.id).toBe(a.id + 1);
  });

  it('findById de un id inexistente → undefined', () => {
    expect(repo.findById(999)).toBeUndefined();
  });

  it('findByCountryAndTaxId encuentra por la pareja exacta', () => {
    const created = repo.insert(toInsert(ACME));
    expect(repo.findByCountryAndTaxId('ES', 'B12345674')).toEqual(created);
    expect(repo.findByCountryAndTaxId('PT', 'B12345674')).toBeUndefined();
    expect(repo.findByCountryAndTaxId('ES', 'B12345675')).toBeUndefined();
  });
});

describe('unicidad (país, tax ID) (RF21)', () => {
  it('un duplicado lanza DuplicateCustomerError y no crea otra fila', () => {
    repo.insert(toInsert(ACME));
    const again = (): void => {
      repo.insert(toInsert({ ...ACME, companyName: 'Otra SL', email: 'otra@x.es' }));
    };
    expect(again).toThrow(DuplicateCustomerError);
    expect(repo.search()).toHaveLength(1);
  });

  it('el error lleva el país y el tax ID duplicados', () => {
    repo.insert(toInsert(ACME));
    try {
      repo.insert(toInsert(ACME));
      expect.unreachable('se esperaba DuplicateCustomerError');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateCustomerError);
      expect(error).toMatchObject({ country: 'ES', taxId: 'B12345674' });
    }
  });

  it('el mismo tax ID en otro país se acepta', () => {
    repo.insert(toInsert(ACME));
    const other = repo.insert(toInsert({ ...ACME, country: 'MX', taxIdType: 'OTHER' }));
    expect(other.country).toBe('MX');
    expect(repo.search()).toHaveLength(2);
  });

  it('el email no es único (D9)', () => {
    repo.insert(toInsert(ACME));
    expect(() => repo.insert(named('Otra SL', 'A11111111'))).not.toThrow();
  });
});

describe('search (RF23, filtro con instr)', () => {
  function namesOf(filter?: Parameters<CustomersRepository['search']>[0]): string[] {
    return repo
      .search(filter)
      .map((c) => c.companyName)
      .sort();
  }

  beforeEach(() => {
    repo.insert(named('Acme Ibérica SL', 'B12345674'));
    repo.insert(named('100% Cloud SA', 'A58818501'));
    repo.insert(named('Data_Labs SL', 'B00000190'));
    repo.insert(named('Datax Labs SL', 'Q0000019J'));
  });

  it('sin filtro devuelve todas las filas', () => {
    expect(repo.search()).toHaveLength(4);
  });

  it('filtra por company_name_search (clave en minúsculas), no por el nombre original', () => {
    expect(namesOf({ nameKey: 'ibérica', taxIdFragment: '' })).toEqual(['Acme Ibérica SL']);
    expect(namesOf({ nameKey: 'Ibérica', taxIdFragment: '' })).toEqual([]);
  });

  it('no ignora tildes', () => {
    expect(namesOf({ nameKey: 'iberica', taxIdFragment: '' })).toEqual([]);
  });

  it('% es un carácter literal, no un comodín', () => {
    expect(namesOf({ nameKey: '%', taxIdFragment: '' })).toEqual(['100% Cloud SA']);
  });

  it('_ es un carácter literal, no un comodín', () => {
    expect(namesOf({ nameKey: 'data_', taxIdFragment: '' })).toEqual(['Data_Labs SL']);
  });

  it('también encuentra por fragmento del tax ID', () => {
    expect(namesOf({ nameKey: 'zzz', taxIdFragment: '2345' })).toEqual(['Acme Ibérica SL']);
  });

  it('nombre o tax ID: une las dos condiciones', () => {
    expect(namesOf({ nameKey: 'cloud', taxIdFragment: '0000019' })).toEqual([
      '100% Cloud SA',
      'Data_Labs SL',
      'Datax Labs SL',
    ]);
  });

  it('con taxIdFragment vacío solo busca por nombre', () => {
    expect(namesOf({ nameKey: 'zzz', taxIdFragment: '' })).toEqual([]);
  });

  it('devuelve objetos Customer completos', () => {
    const [found] = repo.search({ nameKey: 'acme', taxIdFragment: '' });
    expect(found).toEqual({ ...ACME, id: 1, createdAt: CREATED_AT, simulationCount: 0 });
  });
});

describe('simulationCount (spec 005, RF1)', () => {
  function addSimulations(customerId: number, n: number): void {
    const stmt = db.prepare(
      `INSERT INTO simulations (customer_id, users, storage, api_calls, tiers_json, base_cents, country,
       vat_rate_percent, vat_cents, total_cents, created_at) VALUES (?, 1, 0, 0, '[]', 0, 'ES', 21, 0, 0, ?)`,
    );
    for (let i = 0; i < n; i += 1) stmt.run(customerId, CREATED_AT);
  }

  it('cuenta 0, 1 y 3 simulaciones en findById y search', () => {
    const a = repo.insert(named('Uno SL', 'B12345674'));
    const b = repo.insert(named('Dos SL', 'A58818501'));
    const c = repo.insert(named('Tres SL', 'B00000019'));
    addSimulations(b.id, 1);
    addSimulations(c.id, 3);
    expect(repo.findById(a.id)?.simulationCount).toBe(0);
    expect(repo.findById(b.id)?.simulationCount).toBe(1);
    expect(repo.findById(c.id)?.simulationCount).toBe(3);
    expect(repo.search().map((x) => x.simulationCount)).toEqual([0, 1, 3]);
  });
});
