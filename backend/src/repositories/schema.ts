// Esquema de la BD (plan §6.2). Vive en repositories/ porque el SQL solo va aquí (principio 6).
// Los CHECK son una red de integridad, no reglas de negocio: esas viven en shared/.
// company_name_search = toSearchKey(company_name); si toSearchKey cambia, hay que recalcularla
// con una migración (plan §6.1).
import type Database from 'better-sqlite3';
import { migrateSimulationCurrencyCheck } from './simulations-currency-check';
import { SIMULATIONS_INDEX_DDL, simulationsTableDdl } from './simulations-ddl';
import { migrateSimulationCurrency } from './simulations-migration';

const DDL = `
CREATE TABLE IF NOT EXISTS customers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name        TEXT NOT NULL,
  company_name_search TEXT NOT NULL,
  tax_id              TEXT NOT NULL,
  tax_id_type         TEXT NOT NULL CHECK (tax_id_type IN
                        ('DNI','NIE','CIF','PT_NIF','FR_SIREN','DE_VAT','IT_PIVA','GB_VAT','OTHER')),
  email               TEXT NOT NULL,
  country             TEXT NOT NULL CHECK (length(country) = 2),
  plan                TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  created_at          TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_country_tax_id_uq ON customers (country, tax_id);
`;

const SIMULATIONS_DDL = `${simulationsTableDdl('simulations')}
${SIMULATIONS_INDEX_DDL}`;

/** Crea customers (UNIQUE country, tax_id) y simulations (FK RESTRICT, RF13). Idempotente. */
export function migrate(db: Database.Database): void {
  db.exec(DDL);
  db.exec(SIMULATIONS_DDL);
  migrateSimulationCurrency(db);
  migrateSimulationCurrencyCheck(db);
}
