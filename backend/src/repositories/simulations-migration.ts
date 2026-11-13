// Migración idempotente de la 004 (RF20, plan §6): añade a `simulations` la divisa, el tipo
// congelado y los importes convertidos. Las filas de la 003 pasan a EUR con tipo 1.000000.
import type Database from 'better-sqlite3';

/** Columnas nuevas, todas NOT NULL; el DEFAULT es solo el valor transitorio que exige SQLite. */
export const CURRENCY_COLUMNS: readonly string[] = [
  `currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD','GBP'))`,
  `exchange_rate_micros INTEGER NOT NULL DEFAULT 1000000 CHECK (exchange_rate_micros BETWEEN 10000 AND 100000000)`,
  `exchange_rate_at TEXT NOT NULL DEFAULT ''`,
  `converted_base_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_base_cents >= 0)`,
  `converted_vat_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_vat_cents >= 0)`,
  `converted_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_total_cents >= 0)`,
];

const BACKFILL = `UPDATE simulations SET exchange_rate_at = created_at,
  converted_base_cents = base_cents, converted_vat_cents = vat_cents, converted_total_cents = total_cents`;

/** Si `currency` ya existe no hace nada; si no, añade las seis columnas y rellena en una transacción. */
export function migrateSimulationCurrency(db: Database.Database): void {
  const columns = db.pragma('table_info(simulations)') as { name: string }[];
  if (columns.some((column) => column.name === 'currency')) return;
  db.transaction(() => {
    for (const definition of CURRENCY_COLUMNS) db.exec(`ALTER TABLE simulations ADD COLUMN ${definition}`);
    db.exec(BACKFILL);
  })();
}
