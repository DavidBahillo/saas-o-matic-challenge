// Reconstrucción de `simulations` con el DDL vigente, compartida por las migraciones de la 007 y la 009.
// SQLite no cambia un CHECK ni una FK: se crea la tabla nueva, se copian filas con sus ids, se sustituye
// la antigua y se recrea el índice, todo en una transacción.
import type Database from 'better-sqlite3';
import { SIMULATIONS_COLUMNS, SIMULATIONS_INDEX_DDL, simulationsTableDdl } from './simulations-ddl';

export function rebuildSimulationsTable(db: Database.Database): void {
  db.transaction(() => {
    db.exec(simulationsTableDdl('simulations_new').replace('CREATE TABLE IF NOT EXISTS', 'CREATE TABLE'));
    db.exec(`INSERT INTO simulations_new (${SIMULATIONS_COLUMNS}) SELECT ${SIMULATIONS_COLUMNS} FROM simulations`);
    db.exec('DROP TABLE simulations');
    db.exec('ALTER TABLE simulations_new RENAME TO simulations');
    db.exec(SIMULATIONS_INDEX_DDL);
  })();
}
