// Base creada con la 003 (sin columnas de divisa), para probar la migración de la 004 (RF20).
import type Database from 'better-sqlite3';

const LEGACY_DDL = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT NOT NULL, company_name_search TEXT NOT NULL,
  tax_id TEXT NOT NULL, tax_id_type TEXT NOT NULL, email TEXT NOT NULL,
  country TEXT NOT NULL CHECK (length(country) = 2), plan TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX customers_country_tax_id_uq ON customers (country, tax_id);
CREATE TABLE simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  users INTEGER NOT NULL, storage INTEGER NOT NULL, api_calls INTEGER NOT NULL,
  tiers_json TEXT NOT NULL, base_cents INTEGER NOT NULL, country TEXT NOT NULL,
  vat_rate_percent INTEGER NOT NULL, vat_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX simulations_customer_created_idx ON simulations (customer_id, created_at DESC, id DESC);
`;

const TIERS = JSON.stringify([
  { tier: 1, from: 1, to: 10, unitPriceCents: 1000, billedUsers: 10, subtotalCents: 10000 },
  { tier: 2, from: 11, to: 50, unitPriceCents: 800, billedUsers: 5, subtotalCents: 4000 },
  { tier: 3, from: 51, to: null, unitPriceCents: 500, billedUsers: 0, subtotalCents: 0 },
]);

/** Cliente 1 (ES) y dos simulaciones de 15 usuarios, creadas el 2 y el 3 de noviembre. */
export function seedLegacyDatabase(db: Database.Database): void {
  db.exec(LEGACY_DDL);
  db.prepare(`INSERT INTO customers VALUES (1, 'Acme', 'acme', 'B12345674', 'CIF', 'a@acme.es', 'ES', 'growth', ?)`).run(
    '2026-11-01T00:00:00.000Z',
  );
  const insert = db.prepare(`INSERT INTO simulations
    (customer_id, users, storage, api_calls, tiers_json, base_cents, country, vat_rate_percent, vat_cents,
     total_cents, created_at) VALUES (1, 15, 50, 0, ?, 14000, 'ES', 21, 2940, 16940, ?)`);
  insert.run(TIERS, '2026-11-02T10:00:00.000Z');
  insert.run(TIERS, '2026-11-03T10:00:00.000Z');
}
