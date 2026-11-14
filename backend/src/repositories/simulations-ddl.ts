// DDL de `simulations` compartido por el esquema y por la migración que reconstruye la tabla.
// El CHECK de `currency` es solo una red de integridad (length = 3): la lista real vive en shared/ (007).

export const SIMULATIONS_INDEX_DDL = `CREATE INDEX IF NOT EXISTS simulations_customer_created_idx
  ON simulations (customer_id, created_at DESC, id DESC);`;

/** Columnas en el orden del DDL, para copiar filas con nombre. */
export const SIMULATIONS_COLUMNS = `id, customer_id, users, storage, api_calls, tiers_json, base_cents,
  country, vat_rate_percent, vat_cents, total_cents, created_at, currency, exchange_rate_micros,
  exchange_rate_at, converted_base_cents, converted_vat_cents, converted_total_cents`;

export function simulationsTableDdl(name: string): string {
  return `CREATE TABLE IF NOT EXISTS ${name} (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
  currency              TEXT    NOT NULL DEFAULT 'EUR' CHECK (length(currency) = 3),
  exchange_rate_micros  INTEGER NOT NULL DEFAULT 1000000
                          CHECK (exchange_rate_micros BETWEEN 10000 AND 100000000),
  exchange_rate_at      TEXT    NOT NULL DEFAULT '',
  converted_base_cents  INTEGER NOT NULL DEFAULT 0 CHECK (converted_base_cents >= 0),
  converted_vat_cents   INTEGER NOT NULL DEFAULT 0 CHECK (converted_vat_cents >= 0),
  converted_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_total_cents >= 0)
);`;
}
