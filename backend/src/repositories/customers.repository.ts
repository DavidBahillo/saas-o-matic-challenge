// Repositorio de clientes (plan §6.1 y §6.3). Solo SQL y traducción de errores, sin reglas de negocio.
import Database from 'better-sqlite3';
import type { Customer, DeleteCustomerResult, NewCustomer } from '@saas-o-matic/shared';
import { CUSTOMER_COLUMNS, CUSTOMER_SELECT, rowToCustomer } from './customer-row';
import type { CustomerRow } from './customer-row';

/** Datos que el service calcula antes de insertar: clave de búsqueda y fecha de alta. */
export interface CustomerInsert extends NewCustomer {
  companyNameSearch: string;
  createdAt: string;
}

/** Datos de una edición (009): el cuerpo validado y la clave de búsqueda recalculada. */
export interface CustomerUpdate extends NewCustomer {
  companyNameSearch: string;
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
  /** `undefined` si no existe; lanza DuplicateCustomerError si otro cliente tiene ese (país, tax ID). */
  update(id: number, input: CustomerUpdate): Customer | undefined;
  /** Borra el cliente y, por la FK en cascada, sus simulaciones, contándolas en la misma transacción. */
  deleteWithSimulations(id: number): DeleteCustomerResult | undefined;
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

const UPDATE_SQL = `
UPDATE customers SET company_name = @companyName, company_name_search = @companyNameSearch,
  tax_id = @taxId, tax_id_type = @taxIdType, email = @email, country = @country, plan = @plan
WHERE id = @id`;
const COUNT_SIMULATIONS_SQL = 'SELECT COUNT(*) AS n FROM simulations WHERE customer_id = ?';
const DELETE_SQL = 'DELETE FROM customers WHERE id = ?';

const SELECT_BY_ID_SQL = `SELECT ${CUSTOMER_SELECT} FROM customers WHERE id = ?`;
const SELECT_BY_KEY_SQL = `SELECT ${CUSTOMER_SELECT} FROM customers WHERE country = ? AND tax_id = ?`;
const SELECT_ALL_SQL = `SELECT ${CUSTOMER_SELECT} FROM customers`;
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

function runUpdate(
  statement: Database.Statement<[CustomerUpdate & { id: number }]>,
  input: CustomerUpdate & { id: number },
): number {
  try {
    return statement.run(input).changes;
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateCustomerError(input.country, input.taxId);
    throw error;
  }
}

/** Transacciones de escritura de la 009: el SELECT final y el recuento van dentro de la misma transacción. */
function prepareWrites(db: Database.Database, byIdStmt: Database.Statement<[number], CustomerRow>) {
  const updateStmt = db.prepare<[CustomerUpdate & { id: number }]>(UPDATE_SQL);
  const countSimsStmt = db.prepare<[number], { n: number }>(COUNT_SIMULATIONS_SQL);
  const deleteStmt = db.prepare<[number]>(DELETE_SQL);
  const updateTx = db.transaction((id: number, input: CustomerUpdate): Customer | undefined => {
    if (runUpdate(updateStmt, { ...input, id }) === 0) return undefined;
    const row = byIdStmt.get(id);
    return row === undefined ? undefined : rowToCustomer(row);
  });
  const deleteTx = db.transaction((id: number): DeleteCustomerResult | undefined => {
    const deletedSimulations = countSimsStmt.get(id)?.n ?? 0;
    return deleteStmt.run(id).changes === 0 ? undefined : { deletedSimulations };
  });
  return { updateTx, deleteTx };
}

export function createCustomersRepository(db: Database.Database): CustomersRepository {
  const insertStmt = db.prepare<[CustomerInsert], CustomerRow>(INSERT_SQL);
  const byIdStmt = db.prepare<[number], CustomerRow>(SELECT_BY_ID_SQL);
  const byKeyStmt = db.prepare<[string, string], CustomerRow>(SELECT_BY_KEY_SQL);
  const allStmt = db.prepare<[], CustomerRow>(SELECT_ALL_SQL);
  const searchStmt = db.prepare<[CustomerSearchFilter], CustomerRow>(SEARCH_SQL);
  const { updateTx, deleteTx } = prepareWrites(db, byIdStmt);

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
    update(id, input) {
      return updateTx.immediate(id, input);
    },
    deleteWithSimulations(id) {
      return deleteTx.immediate(id);
    },
  };
}
