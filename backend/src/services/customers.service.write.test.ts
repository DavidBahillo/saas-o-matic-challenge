// Servicio de clientes, spec 009: search paginado, update (404, 409, carrera) y remove.
import type { NewCustomer } from '@saas-o-matic/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openDatabase } from '../db/connection';
import { HttpError } from '../http/errors';
import { DuplicateCustomerError, createCustomersRepository } from '../repositories/customers.repository';
import type { CustomersRepository } from '../repositories/customers.repository';
import { migrate } from '../repositories/schema';
import { createCustomersService } from './customers.service';
import type { CustomersService } from './customers.service';

const ACME: NewCustomer = {
  companyName: 'Acme Ibérica SL',
  taxId: 'B12345674',
  taxIdType: 'CIF',
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth',
};
const OTHER: NewCustomer = { ...ACME, companyName: 'Otra SL', taxId: 'A58818501' };

let db: Database.Database;
let service: CustomersService;

function build(wrap?: (real: CustomersRepository) => CustomersRepository): void {
  const real = createCustomersRepository(db);
  service = createCustomersService(wrap?.(real) ?? real, () => new Date('2026-11-12T10:00:00.000Z'));
}

function thrown(fn: () => unknown): HttpError {
  try {
    fn();
  } catch (error) {
    if (error instanceof HttpError) return error;
    throw error;
  }
  throw new Error('No lanzó');
}

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
  build();
});

afterEach(() => {
  db.close();
});

describe('search paginado (RF1, RF5)', () => {
  function seed(n: number): void {
    for (let i = 0; i < n; i += 1) {
      service.create({
        ...ACME,
        companyName: `Cliente ${String(i).padStart(3, '0')}`,
        taxId: `9${String(i).padStart(8, '0')}`,
        taxIdType: 'OTHER',
        country: 'US',
      });
    }
  }

  it('devuelve 20 por página con page y pageSize, sin tope de 50', () => {
    seed(51);
    const p1 = service.search(undefined, 1);
    expect(p1).toMatchObject({ total: 51, page: 1, pageSize: 20 });
    expect(p1.items).toHaveLength(20);
    const p3 = service.search(undefined, 3);
    expect(p3.items).toHaveLength(11);
    expect(p3.items[10]?.companyName).toBe('Cliente 050');
  });

  it('recorta la página fuera de rango y pagina sobre las coincidencias', () => {
    seed(21);
    expect(service.search(undefined, 999)).toMatchObject({ page: 2, total: 21 });
    expect(service.search('cliente 02', 5)).toMatchObject({ page: 1, total: 1 });
    expect(service.search('nada', 1)).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });
});

describe('update', () => {
  it('actualiza, normaliza la clave de búsqueda y devuelve el cliente', () => {
    const created = service.create(ACME);
    const updated = service.update(created.id, { ...ACME, companyName: 'Zeta SL' });
    expect(updated).toMatchObject({ id: created.id, companyName: 'Zeta SL', createdAt: created.createdAt });
    expect(service.search('zeta', 1).total).toBe(1);
  });

  it('404 CUSTOMER_NOT_FOUND si no existe', () => {
    expect(thrown(() => service.update(99, ACME))).toMatchObject({ status: 404, code: 'CUSTOMER_NOT_FOUND' });
  });

  it('409 con existingId frente a otro cliente; no es duplicado de sí mismo', () => {
    const first = service.create(ACME);
    const second = service.create(OTHER);
    expect(service.update(first.id, ACME).id).toBe(first.id);
    const error = thrown(() => service.update(second.id, ACME));
    expect(error.toBody().error).toMatchObject({ code: 'CUSTOMER_ALREADY_EXISTS', details: { existingId: first.id } });
  });

  it('si el cliente en conflicto desaparece entre medias, reintenta una vez y guarda', () => {
    const first = service.create(ACME);
    const second = service.create(OTHER);
    let removed = false;
    build((real) => ({
      ...real,
      findByCountryAndTaxId(country, taxId) {
        if (!removed) {
          removed = true;
          real.deleteWithSimulations(first.id);
          return undefined;
        }
        return real.findByCountryAndTaxId(country, taxId);
      },
    }));
    expect(service.update(second.id, ACME)).toMatchObject({ id: second.id, taxId: 'B12345674' });
  });

  it('si el conflicto persiste sin existente visible, responde 409 y nunca 500', () => {
    const second = service.create(OTHER);
    build((real) => ({
      ...real,
      update() {
        throw new DuplicateCustomerError('ES', 'B12345674');
      },
      findByCountryAndTaxId: () => undefined,
    }));
    expect(thrown(() => service.update(second.id, ACME))).toMatchObject({ status: 409, code: 'CUSTOMER_ALREADY_EXISTS' });
  });
});

describe('remove', () => {
  it('borra y devuelve deletedSimulations', () => {
    const created = service.create(ACME);
    expect(service.remove(created.id)).toEqual({ deletedSimulations: 0 });
    expect(thrown(() => service.getById(created.id))).toMatchObject({ code: 'CUSTOMER_NOT_FOUND' });
  });

  it('404 CUSTOMER_NOT_FOUND si no existe', () => {
    expect(thrown(() => service.remove(99))).toMatchObject({ status: 404, code: 'CUSTOMER_NOT_FOUND' });
  });
});
