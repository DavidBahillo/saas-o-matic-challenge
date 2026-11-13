// Migración idempotente de la 007 (plan §5): el CHECK de `currency` pasa de la lista antigua
// ('EUR','USD','GBP') a length(currency) = 3. SQLite no cambia un CHECK: se reconstruye la tabla
// en una transacción, con las mismas filas e ids, y se recrea el índice. Nada referencia a simulations.
import type Database from 'better-sqlite3';
import { SIMULATIONS_COLUMNS, SIMULATIONS_INDEX_DDL, simulationsTableDdl } from './simulations-ddl';

const OLD_CHECK = `IN ('EUR','USD','GBP')`;

function hasOldCheck(db: Database.Database): boolean {
  const row = db.prepare<[], { sql: string }>(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'simulations'`).get();
  return row !== undefined && row.sql.includes(OLD_CHECK);
}

/** Si `simulations` conserva la lista antigua en el CHECK, la reconstruye; si no, no hace nada. */
export function migrateSimulationCurrencyCheck(db: Database.Database): void {
  if (!hasOldCheck(db)) return;
  db.transaction(() => {
    db.exec(simulationsTableDdl('simulations_new').replace('CREATE TABLE IF NOT EXISTS', 'CREATE TABLE'));
    db.exec(`INSERT INTO simulations_new (${SIMULATIONS_COLUMNS}) SELECT ${SIMULATIONS_COLUMNS} FROM simulations`);
    db.exec('DROP TABLE simulations');
    db.exec('ALTER TABLE simulations_new RENAME TO simulations');
    db.exec(SIMULATIONS_INDEX_DDL);
  })();
}
