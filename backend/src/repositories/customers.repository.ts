// Repositorio de clientes (plan §6.1 y §6.3). Solo SQL y traducción de errores, sin reglas de negocio.
import Database from 'better-sqlite3';
import type { Customer, NewCustomer } from '@saas-o-matic/shared';
import { CUSTOMER_COLUMNS, rowToCustomer } from './customer-row';
import type { CustomerRow } from './customer-row';

/** Datos que el service calcula antes de insertar: clave de búsqueda y fecha de alta. */
export interface CustomerInsert extends NewCustomer {
  companyNameSearch: string;
  createdAt: string;
}

/** Filtro ya normalizado por el service: `nameKey` no vacío; `taxIdFragment` puede serlo. */
export interface CustomerSearchFilter {
  nameKey: string;
  taxIdFragment: string;
}

export interface CustomersRepository {
  insert(input: CustomerInsert): Customer;
  findById(id: number): Customer | undefined;
  findByCountryAndTaxId(country: string, taxId: string): Customer | undefined;
  /** Sin filtro devuelve todas las filas. Sin orden: el service ordena (RF24). */
  search(filter?: CustomerSearchFilter): Customer[];
}

/** Ya existe un cliente con el mismo país y tax ID (índice UNIQUE, RF21). */
export class DuplicateCustomerError extends Error {
  override readonly name = 'DuplicateCustomerError';
  constructor(
    readonly country: string,
    readonly taxId: string,
  ) {
    super(`Ya existe un cliente con el identificador ${taxId} en ${country}.`);
  }
}

const INSERT_SQL = `
INSERT INTO customers
  (company_name, company_name_search, tax_id, tax_id_type, email, country, plan, created_at)
VALUES
  (@companyName, @companyNameSearch, @taxId, @taxIdType, @email, @country, @plan, @createdAt)
RETURNING ${CUSTOMER_COLUMNS}`;

const SELECT_BY_ID_SQL = `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE id = ?`;
const SELECT_BY_KEY_SQL = `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE country = ? AND tax_id = ?`;
const SELECT_ALL_SQL = `SELECT ${CUSTOMER_COLUMNS} FROM customers`;
// instr compara literalmente: % y _ no son comodines y no hace falta escaparlos (plan §6.1).
const SEARCH_SQL = `${SELECT_ALL_SQL}
WHERE instr(company_name_search, @nameKey) > 0
   OR (@taxIdFragment <> '' AND instr(tax_id, @taxIdFragment) > 0)`;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Database.SqliteError && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

function insertOrThrowDuplicate(
  statement: Database.Statement<[CustomerInsert], CustomerRow>,
  input: CustomerInsert,
): CustomerRow | undefined {
  try {
    return statement.get(input);
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateCustomerError(input.country, input.taxId);
    throw error;
  }
}

export function createCustomersRepository(db: Database.Database): CustomersRepository {
  const insertStmt = db.prepare<[CustomerInsert], CustomerRow>(INSERT_SQL);
  const byIdStmt = db.prepare<[number], CustomerRow>(SELECT_BY_ID_SQL);
  const byKeyStmt = db.prepare<[string, string], CustomerRow>(SELECT_BY_KEY_SQL);
  const allStmt = db.prepare<[], CustomerRow>(SELECT_ALL_SQL);
  const searchStmt = db.prepare<[CustomerSearchFilter], CustomerRow>(SEARCH_SQL);

  return {
    insert(input) {
      const row = insertOrThrowDuplicate(insertStmt, input);
      if (row === undefined) throw new Error('El INSERT no devolvió la fila creada.');
      return rowToCustomer(row);
    },
    findById(id) {
      const row = byIdStmt.get(id);
      return row === undefined ? undefined : rowToCustomer(row);
    },
    findByCountryAndTaxId(country, taxId) {
      const row = byKeyStmt.get(country, taxId);
      return row === undefined ? undefined : rowToCustomer(row);
    },
    search(filter) {
      const rows = filter === undefined ? allStmt.all() : searchStmt.all(filter);
      return rows.map(rowToCustomer);
    },
  };
}
