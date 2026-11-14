// Casos de uso de clientes (plan §6.1 y §6.3). Recibe un NewCustomer ya validado, calcula la
// clave de búsqueda y la fecha de alta, e inserta sin consultar antes (evita la carrera entre
// comprobar e insertar). Un duplicado del índice UNIQUE se traduce en 409 con existingId (RF21).
// La búsqueda filtra en SQL y ordena en memoria con la colación española de shared/ (RF23, RF24).
import { PAGE_SIZE, normalizeTaxId, paginate, sortByNameEs, toSearchKey } from '@saas-o-matic/shared';
import type { Customer, CustomerList, DeleteCustomerResult, NewCustomer } from '@saas-o-matic/shared';
import { customerAlreadyExists, customerNotFound } from '../http/errors';
import { DuplicateCustomerError } from '../repositories/customers.repository';
import type { CustomerSearchFilter, CustomersRepository } from '../repositories/customers.repository';

export interface CustomersService {
  create(input: NewCustomer): Customer;
  /** 404 CUSTOMER_NOT_FOUND si no existe (RF22). */
  getById(id: number): Customer;
  /** `q` ya validado y recortado; `undefined` devuelve todos. `page` se recorta al rango (009, RF1, RF5). */
  search(q: string | undefined, page: number): CustomerList;
  /** 404 CUSTOMER_NOT_FOUND; 409 CUSTOMER_ALREADY_EXISTS si otro cliente tiene ese (país, tax ID) (009). */
  update(id: number, input: NewCustomer): Customer;
  /** 404 CUSTOMER_NOT_FOUND; borra el cliente y sus simulaciones atómicamente (009, RF20). */
  remove(id: number): DeleteCustomerResult;
}

/** Si q queda vacío como tax ID (por ejemplo `-`), el repositorio solo busca por nombre (RF23). */
function toSearchFilter(q: string): CustomerSearchFilter {
  return { nameKey: toSearchKey(q), taxIdFragment: normalizeTaxId(q) };
}

/** UPDATE sin consulta previa: el UNIQUE decide. Si el cliente en conflicto ya no existe, un reintento (RF15). */
function updateOrConflict(repository: CustomersRepository, id: number, input: NewCustomer, retry: boolean): Customer {
  const companyNameSearch = toSearchKey(input.companyName);
  try {
    const updated = repository.update(id, { ...input, companyNameSearch });
    if (updated === undefined) throw customerNotFound(id);
    return updated;
  } catch (error) {
    if (!(error instanceof DuplicateCustomerError)) throw error;
    const existing = repository.findByCountryAndTaxId(error.country, error.taxId);
    if (existing === undefined && retry) return updateOrConflict(repository, id, input, false);
    throw customerAlreadyExists(error.country, existing?.id);
  }
}

export type Clock = () => Date;

export function createCustomersService(repository: CustomersRepository, now: Clock): CustomersService {
  function toConflict(error: DuplicateCustomerError): Error {
    const existing = repository.findByCountryAndTaxId(error.country, error.taxId);
    return customerAlreadyExists(error.country, existing?.id);
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
    search(q, page) {
      const matches = repository.search(q === undefined ? undefined : toSearchFilter(q));
      return paginate(sortByNameEs(matches), page, PAGE_SIZE);
    },
    update(id, input) {
      return updateOrConflict(repository, id, input, true);
    },
    remove(id) {
      const result = repository.deleteWithSimulations(id);
      if (result === undefined) throw customerNotFound(id);
      return result;
    },
  };
}
