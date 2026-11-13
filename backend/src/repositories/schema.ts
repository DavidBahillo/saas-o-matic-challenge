// Esquema de la BD (plan §6.2). Vive en repositories/ porque el SQL solo va aquí (principio 6).
// Los CHECK son una red de integridad, no reglas de negocio: esas viven en shared/.
// company_name_search = toSearchKey(company_name); si toSearchKey cambia, hay que recalcularla
// con una migración (plan §6.1).
import type Database from 'better-sqlite3';
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
CREATE TABLE IF NOT EXISTS simulations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  users            INTEGER NOT NULL CHECK (users BETWEEN 0 AND 100000),
  storage          INTEGER NOT NULL CHECK (storage BETWEEN 0 AND 1000000),
  api_calls        INTEGER NOT NULL CHECK (api_calls BETWEEN 0 AND 1000000),
  tiers_json       TEXT    NOT NULL,
  base_cents       INTEGER NOT NULL CHECK (base_cents >= 0),
  country          TEXT    NOT NULL CHECK (length(country) = 2),
  vat_rate_percent INTEGER NOT NULL CHECK (vat_rate_percent >= 0),
  vat_cents        INTEGER NOT NULL CHECK (vat_cents >= 0),
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at       TEXT    NOT NULL,
  currency              TEXT    NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD','GBP')),
  exchange_rate_micros  INTEGER NOT NULL DEFAULT 1000000
                          CHECK (exchange_rate_micros BETWEEN 10000 AND 100000000),
  exchange_rate_at      TEXT    NOT NULL DEFAULT '',
  converted_base_cents  INTEGER NOT NULL DEFAULT 0 CHECK (converted_base_cents >= 0),
  converted_vat_cents   INTEGER NOT NULL DEFAULT 0 CHECK (converted_vat_cents >= 0),
  converted_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_total_cents >= 0)
);
CREATE INDEX IF NOT EXISTS simulations_customer_created_idx
  ON simulations (customer_id, created_at DESC, id DESC);
`;

/** Crea customers (UNIQUE country, tax_id) y simulations (FK RESTRICT, RF13). Idempotente. */
export function migrate(db: Database.Database): void {
  db.exec(DDL);
  migrateSimulationCurrency(db);
}
