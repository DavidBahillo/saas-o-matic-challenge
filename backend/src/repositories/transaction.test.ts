import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db/connection';
import { runInAsyncTransaction } from './transaction';

let db: Database.Database;

beforeEach(() => {
  db = openDatabase(':memory:');
  db.exec('CREATE TABLE t (n INTEGER)');
});

afterEach(() => {
  db.close();
});

const count = (): number => (db.prepare('SELECT COUNT(*) AS c FROM t').get() as { c: number }).c;

describe('runInAsyncTransaction', () => {
  it('confirma al resolver y devuelve el valor', async () => {
    const value = await runInAsyncTransaction(db, async () => {
      db.prepare('INSERT INTO t VALUES (1)').run();
      await Promise.resolve();
      return 'ok';
    });
    expect(value).toBe('ok');
    expect(count()).toBe(1);
    expect(db.inTransaction).toBe(false);
  });

  it('deshace al rechazar y relanza el mismo error', async () => {
    const boom = new Error('boom');
    await expect(
      runInAsyncTransaction(db, async () => {
        db.prepare('INSERT INTO t VALUES (1)').run();
        await Promise.resolve();
        throw boom;
      }),
    ).rejects.toBe(boom);
    expect(count()).toBe(0);
    expect(db.inTransaction).toBe(false);
  });
});
