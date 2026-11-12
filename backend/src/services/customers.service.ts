// Casos de uso de clientes (plan §6.1 y §6.3). Recibe un NewCustomer ya validado, calcula la
// clave de búsqueda y la fecha de alta, e inserta sin consultar antes (evita la carrera entre
// comprobar e insertar). Un duplicado del índice UNIQUE se traduce en 409 con existingId (RF21).
// La búsqueda filtra en SQL y ordena en memoria con la colación española de shared/ (RF23, RF24).
import { normalizeTaxId, sortByNameEs, toSearchKey } from '@saas-o-matic/shared';
import type { Customer, CustomerList, NewCustomer } from '@saas-o-matic/shared';
import { customerAlreadyExists, customerNotFound } from '../http/errors';
import { DuplicateCustomerError } from '../repositories/customers.repository';
import type { CustomerSearchFilter, CustomersRepository } from '../repositories/customers.repository';

export const SEARCH_MAX_RESULTS = 50;

export interface CustomersService {
  create(input: NewCustomer): Customer;
  /** 404 CUSTOMER_NOT_FOUND si no existe (RF22). */
  getById(id: number): Customer;
  /** `q` ya validado y recortado; `undefined` devuelve todos los clientes (RF24). */
  search(q: string | undefined): CustomerList;
}

/** Si q queda vacío como tax ID (por ejemplo `-`), el repositorio solo busca por nombre (RF23). */
function toSearchFilter(q: string): CustomerSearchFilter {
  return { nameKey: toSearchKey(q), taxIdFragment: normalizeTaxId(q) };
}

export type Clock = () => Date;

export function createCustomersService(repository: CustomersRepository, now: Clock): CustomersService {
  function toConflict(error: DuplicateCustomerError): Error {
    const existing = repository.findByCountryAndTaxId(error.country, error.taxId);
    // Sin borrados en la 001 no debería ocurrir; si ocurre, es un error inesperado (500).
    return existing === undefined ? error : customerAlreadyExists(error.country, existing.id);
  }

  return {
    create(input) {
      const companyNameSearch = toSearchKey(input.companyName);
      try {
        return repository.insert({ ...input, companyNameSearch, createdAt: now().toISOString() });
      } catch (error) {
        throw error instanceof DuplicateCustomerError ? toConflict(error) : error;
      }
    },
    getById(id) {
      const customer = repository.findById(id);
      if (customer === undefined) throw customerNotFound(id);
      return customer;
    },
    search(q) {
      const matches = repository.search(q === undefined ? undefined : toSearchFilter(q));
      const sorted = sortByNameEs(matches);
      return { items: sorted.slice(0, SEARCH_MAX_RESULTS), total: sorted.length };
    },
  };
}
