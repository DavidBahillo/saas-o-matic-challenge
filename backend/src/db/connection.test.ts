// Tests de openDatabase (plan §6.2) y de la persistencia en disco (RF32) con un archivo temporal.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCustomersRepository } from '../repositories/customers.repository';
import { migrate } from '../repositories/schema';
import { openDatabase } from './connection';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'saas-o-matic-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('openDatabase', () => {
  it(':memory: no usa WAL', () => {
    const db = openDatabase(':memory:');
    expect(db.pragma('journal_mode', { simple: true })).toBe('memory');
    db.close();
  });

  it('con un archivo activa WAL y crea el directorio si no existe', () => {
    const path = join(tempDir, 'nested', 'dir', 'test.db');
    const db = openDatabase(path);
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    db.close();
    expect(existsSync(path)).toBe(true);
  });
});

describe('persistencia en disco (RF32)', () => {
  it('un cliente sigue ahí tras cerrar y reabrir la BD', () => {
    const path = join(tempDir, 'persist.db');
    const first = openDatabase(path);
    migrate(first);
    const created = createCustomersRepository(first).insert({
      companyName: 'Acme Ibérica SL',
      companyNameSearch: 'acme ibérica sl',
      taxId: 'B12345674',
      taxIdType: 'CIF',
      email: 'compras@acme.es',
      country: 'ES',
      plan: 'growth',
      createdAt: '2026-11-12T10:00:00.000Z',
    });
    first.close();

    const second = openDatabase(path);
    migrate(second);
    expect(createCustomersRepository(second).findById(created.id)).toEqual(created);
    second.close();
  });
});

const CUSTOMER = {
  companyName: 'Acme Ibérica SL',
  companyNameSearch: 'acme ibérica sl',
  taxId: 'B12345674',
  taxIdType: 'CIF' as const,
  email: 'compras@acme.es',
  country: 'ES',
  plan: 'growth' as const,
  createdAt: '2026-11-12T10:00:00.000Z',
};

function insertSimulation(db: ReturnType<typeof openDatabase>, customerId: number): void {
  db.prepare(
    `INSERT INTO simulations (customer_id, users, storage, api_calls, tiers_json, base_cents,
       country, vat_rate_percent, vat_cents, total_cents, created_at)
     VALUES (?, 10, 0, 0, '[]', 0, 'ES', 21, 0, 0, '2026-11-12T10:00:00.000Z')`,
  ).run(customerId);
}

describe('claves foráneas y tabla simulations (RF13)', () => {
  it('PRAGMA foreign_keys vale 1 en :memory: y en un archivo', () => {
    const mem = openDatabase(':memory:');
    expect(mem.pragma('foreign_keys', { simple: true })).toBe(1);
    mem.close();
    const file = openDatabase(join(tempDir, 'fk.db'));
    expect(file.pragma('foreign_keys', { simple: true })).toBe(1);
    file.close();
  });

  it('migrate dos veces conserva customers y sus filas y crea simulations', () => {
    const path = join(tempDir, 'migrate.db');
    const db = openDatabase(path);
    migrate(db);
    const created = createCustomersRepository(db).insert(CUSTOMER);
    const ddlBefore = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'customers'").get();
    migrate(db);
    migrate(db);
    expect(db.prepare("SELECT sql FROM sqlite_master WHERE name = 'customers'").get()).toEqual(ddlBefore);
    expect(db.prepare('SELECT COUNT(*) AS n FROM customers').get()).toEqual({ n: 1 });
    expect(createCustomersRepository(db).findById(created.id)).toEqual(created);
    const names = db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'simulations%'").all();
    expect(names).toEqual(expect.arrayContaining([
      { name: 'simulations' }, { name: 'simulations_customer_created_idx' },
    ]));
    db.close();
  });

  it('borrar un cliente con simulaciones lanza y sin simulaciones se borra', () => {
    const db = openDatabase(':memory:');
    migrate(db);
    const repo = createCustomersRepository(db);
    const withSim = repo.insert(CUSTOMER);
    const without = repo.insert({ ...CUSTOMER, taxId: 'A58818501' });
    insertSimulation(db, withSim.id);
    const del = db.prepare('DELETE FROM customers WHERE id = ?');
    // SQLite señala ON DELETE RESTRICT por la vía del trigger.
    expect(() => { del.run(withSim.id); }).toThrow(
      expect.objectContaining({
        name: 'SqliteError',
        code: 'SQLITE_CONSTRAINT_TRIGGER',
        message: 'FOREIGN KEY constraint failed',
      }),
    );
    expect(del.run(without.id).changes).toBe(1);
    db.close();
  });

  it('insertar una simulación con un customer_id inexistente lanza', () => {
    const db = openDatabase(':memory:');
    migrate(db);
    expect(() => { insertSimulation(db, 999); }).toThrow(
      expect.objectContaining({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' }),
    );
    db.close();
  });
});