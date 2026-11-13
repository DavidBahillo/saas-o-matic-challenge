// Fila de la tabla customers y su conversión a Customer (plan §3).
import { TAX_ID_TYPES, isPlan } from '@saas-o-matic/shared';
import type { Customer, TaxIdType } from '@saas-o-matic/shared';

/** Columnas que se leen (company_name_search solo sirve para filtrar). */
export interface CustomerRow {
  id: number;
  company_name: string;
  tax_id: string;
  tax_id_type: string;
  email: string;
  country: string;
  plan: string;
  created_at: string;
  simulation_count: number;
}

const BASE_COLUMNS = 'id, company_name, tax_id, tax_id_type, email, country, plan, created_at';

/** Para RETURNING del INSERT: un cliente recién creado tiene 0 simulaciones (RF3). */
export const CUSTOMER_COLUMNS = `${BASE_COLUMNS}, 0 AS simulation_count`;

/** Para los SELECT: el contador se calcula en cada lectura, sin columna guardada (RF3). */
export const CUSTOMER_SELECT = `${BASE_COLUMNS},
  (SELECT COUNT(*) FROM simulations WHERE customer_id = customers.id) AS simulation_count`;

const TAX_ID_TYPE_SET: ReadonlySet<string> = new Set(TAX_ID_TYPES);

function isTaxIdType(value: string): value is TaxIdType {
  return TAX_ID_TYPE_SET.has(value);
}

/** Convierte una fila en Customer. Los CHECK de la BD garantizan los valores; si no, falla. */
export function rowToCustomer(row: CustomerRow): Customer {
  const { tax_id_type: taxIdType, plan } = row;
  if (!isTaxIdType(taxIdType) || !isPlan(plan)) {
    throw new Error(`Fila de cliente corrupta (id ${String(row.id)}).`);
  }
  return {
    id: row.id,
    companyName: row.company_name,
    taxId: row.tax_id,
    taxIdType,
    email: row.email,
    country: row.country,
    plan,
    createdAt: row.created_at,
    simulationCount: row.simulation_count,
  };
}
