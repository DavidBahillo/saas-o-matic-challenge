// Migración idempotente de la 009 (plan §2.2, RF23): la FK de `simulations` pasa de ON DELETE RESTRICT
// a ON DELETE CASCADE. Solo reconstruye si el DDL guardado aún dice RESTRICT.
import type Database from 'better-sqlite3';
import { rebuildSimulationsTable } from './rebuild-simulations';

function hasRestrict(db: Database.Database): boolean {
  const row = db.prepare<[], { sql: string }>(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'simulations'`).get();
  return row !== undefined && row.sql.includes('ON DELETE RESTRICT');
}

export function migrateSimulationsCascade(db: Database.Database): void {
  if (hasRestrict(db)) rebuildSimulationsTable(db);
}
