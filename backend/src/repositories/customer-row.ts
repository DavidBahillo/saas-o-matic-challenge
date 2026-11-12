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
}

export const CUSTOMER_COLUMNS =
  'id, company_name, tax_id, tax_id_type, email, country, plan, created_at';

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
  };
}
