// Transacción asíncrona (plan §5, excepción justificada D-P2). `db.transaction` de better-sqlite3 es
// síncrona y no admite `await`, pero el alta de simulaciones del servicio es asíncrona. El SQL de
// transacción vive aquí para que el resto del código no lo escriba (principio 6).
import type Database from 'better-sqlite3';

/** BEGIN, `await fn()` y COMMIT; si `fn` rechaza, ROLLBACK y se relanza el mismo error. */
export async function runInAsyncTransaction<T>(db: Database.Database, fn: () => Promise<T>): Promise<T> {
  db.exec('BEGIN');
  try {
    const result = await fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
