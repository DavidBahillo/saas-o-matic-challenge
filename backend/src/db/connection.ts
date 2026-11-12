// Apertura de la base de datos SQLite (plan §6.2). El esquema lo crea `migrate` en repositories/.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

export const IN_MEMORY = ':memory:';

/** Abre la BD; con un archivo crea su directorio si falta y activa el modo WAL. */
export function openDatabase(path: string): Database.Database {
  if (path === IN_MEMORY) return new Database(IN_MEMORY);
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  return db;
}
