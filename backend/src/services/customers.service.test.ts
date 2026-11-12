// El 409 de un duplicado sale de la constraint UNIQUE y no de una comprobación previa (T11, RF21,
// plan §6.3). El repositorio de prueba envuelve el real y su findByCountryAndTaxId devuelve
// `undefined` hasta que la inserción ha fallado: si el service consultara antes de insertar, no
// vería el duplicado y no podría responder 409.
import type { NewCustomer } from '@saas-o-matic/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openDatabase } from '../db/connection';
import { HttpError } from '../http/errors';
import { DuplicateCustomerError, createCustomersRepository } from '../repositories/customers.repository';
import type { CustomersRepository } from '../repositories/customers.repository';
import { migrate } from '../repositories/schema';
import { createCustomersService } from './customers.service';

const INPUT: NewCustomer = {
  companyName: 'Acme Ibérica SL',
  taxId: 'B12345674',
  taxIdType: 'CIF',
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth',
};

let db: Database.Database;
let calls: string[];

/** Registra las llamadas y oculta las filas existentes hasta que el insert ha fallado. */
function blindRepository(real: CustomersRepository): CustomersRepository {
  let insertFailed = false;
  return {
    ...real,
    insert(input) {
      calls.push('insert');
      try {
        return real.insert(input);
      } catch (error) {
        insertFailed = error instanceof DuplicateCustomerError;
        calls.push(insertFailed ? 'insert:UNIQUE' : 'insert:otro');
        throw error;
      }
    },
    findByCountryAndTaxId(country, taxId) {
      calls.push('findByCountryAndTaxId');
      return insertFailed ? real.findByCountryAndTaxId(country, taxId) : undefined;
    },
  };
}

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  calls = [];
});

afterEach(() => {
  db.close();
});

describe('customers.service · 409 desde la constraint UNIQUE (RF21)', () => {
  it('el segundo alta da 409 con existingId aunque la búsqueda previa no vea la fila', () => {
    const repository = blindRepository(createCustomersRepository(db));
    const service = createCustomersService(repository, () => new Date('2026-11-12T10:00:00.000Z'));
    service.create({ ...INPUT, taxId: '12345678Z', taxIdType: 'DNI' });
    const first = service.create(INPUT);
    calls = [];
    let thrown: unknown;
    try {
      service.create(INPUT);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(HttpError);
    if (!(thrown instanceof HttpError)) return;
    expect(thrown.toBody()).toEqual({
      error: {
        code: 'CUSTOMER_ALREADY_EXISTS',
        message: 'Ya existe un cliente con ese identificador fiscal en ES.',
        details: { existingId: first.id },
      },
    });
    expect(first.id).toBe(2);
    expect(calls).toEqual(['insert', 'insert:UNIQUE', 'findByCountryAndTaxId']);
  });
});
