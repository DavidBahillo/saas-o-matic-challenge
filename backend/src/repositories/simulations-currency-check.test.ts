// Migración del CHECK de `currency` (007, plan §5): de la lista antigua a length(currency) = 3.
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedLegacyDatabase } from '../../test/helpers/legacy-db';
import { openDatabase } from '../db/connection';
import { migrate } from './schema';
import { migrateSimulationCurrency } from './simulations-migration';
import { migrateSimulationCurrencyCheck } from './simulations-currency-check';
import { createSimulationsRepository } from './simulations.repository';

const OLD_COLUMNS = [
  `currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD','GBP'))`,
  `exchange_rate_micros INTEGER NOT NULL DEFAULT 1000000 CHECK (exchange_rate_micros BETWEEN 10000 AND 100000000)`,
  `exchange_rate_at TEXT NOT NULL DEFAULT ''`,
  `converted_base_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_base_cents >= 0)`,
  `converted_vat_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_vat_cents >= 0)`,
  `converted_total_cents INTEGER NOT NULL DEFAULT 0 CHECK (converted_total_cents >= 0)`,
];

let db: Database.Database;

/** BD de la 004: legado de la 003 más las columnas con la lista antigua en el CHECK. */
function createOldDatabase(): void {
  seedLegacyDatabase(db);
  for (const column of OLD_COLUMNS) db.exec(`ALTER TABLE simulations ADD COLUMN ${column}`);
  db.exec(`UPDATE simulations SET exchange_rate_at = created_at, converted_base_cents = base_cents,
    converted_vat_cents = vat_cents, converted_total_cents = total_cents`);
  db.prepare(`UPDATE simulations SET currency = 'USD', exchange_rate_micros = 1100000 WHERE id = 2`).run();
}

function tableSql(): string {
  return db.prepare<[], { sql: string }>(`SELECT sql FROM sqlite_master WHERE name = 'simulations'`).get()?.sql ?? '';
}

function insertCurrency(currency: string): void {
  db.prepare(
    `INSERT INTO simulations (customer_id, users, storage, api_calls, tiers_json, base_cents, country,
      vat_rate_percent, vat_cents, total_cents, created_at, currency) VALUES (1, 1, 0, 0, '[]', 1000, 'ES', 21, 210, 1210, ?, ?)`,
  ).run('2026-11-04T10:00:00.000Z', currency);
}

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

describe('migrateSimulationCurrencyCheck', () => {
  it('en una BD con el CHECK antiguo, antes de migrar CHF falla', () => {
    createOldDatabase();
    expect(() => { insertCurrency('CHF'); }).toThrow();
  });

  it('reconstruye conservando filas, ids, orden, FK RESTRICT e índice', () => {
    createOldDatabase();
    const before = createSimulationsRepository(db).listByCustomer(1);
    migrate(db);
    expect(tableSql()).toContain('length(currency) = 3');
    expect(tableSql()).not.toContain(`'EUR','USD','GBP'`);
    expect(createSimulationsRepository(db).listByCustomer(1)).toEqual(before);
    expect(before.map((s) => s.id)).toEqual([2, 1]);
    const fks = db.pragma('foreign_key_list(simulations)') as { on_delete: string; table: string }[];
    expect(fks).toEqual([expect.objectContaining({ table: 'customers', on_delete: 'RESTRICT' })]);
    const index = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'simulations_customer_created_idx'`).get();
    expect(index).toBeDefined();
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('tras migrar se puede insertar y leer CHF y JPY; los ids siguen creciendo', () => {
    createOldDatabase();
    migrate(db);
    insertCurrency('CHF');
    insertCurrency('JPY');
    const items = createSimulationsRepository(db).listByCustomer(1);
    expect(items.map((s) => s.currency)).toEqual(expect.arrayContaining(['CHF', 'JPY']));
    expect(items.map((s) => s.id).sort()).toEqual([1, 2, 3, 4]);
  });

  it('es idempotente: ejecutarla dos veces no cambia nada', () => {
    createOldDatabase();
    migrate(db);
    const sql = tableSql();
    const rows = createSimulationsRepository(db).listByCustomer(1);
    migrateSimulationCurrencyCheck(db);
    migrate(db);
    expect(tableSql()).toBe(sql);
    expect(createSimulationsRepository(db).listByCustomer(1)).toEqual(rows);
  });

  it('una BD nueva nace con length(currency) = 3 y no se reconstruye', () => {
    migrate(db);
    expect(tableSql()).toContain('length(currency) = 3');
    db.prepare(`INSERT INTO customers VALUES (1, 'Acme', 'acme', 'B12345674', 'CIF', 'a@acme.es', 'ES', 'growth', ?)`).run('2026-11-01T00:00:00.000Z');
    insertCurrency('JPY');
    expect(createSimulationsRepository(db).listByCustomer(1).map((s) => s.currency)).toEqual(['JPY']);
  });

  it('una base de la 003 migra por las dos migraciones y acepta CHF', () => {
    seedLegacyDatabase(db);
    migrateSimulationCurrency(db);
    migrateSimulationCurrencyCheck(db);
    insertCurrency('CHF');
    expect(tableSql()).toContain('length(currency) = 3');
  });

  it('si falla a mitad, la transacción deja la tabla original intacta', () => {
    createOldDatabase();
    db.exec(`CREATE TABLE simulations_new (x INTEGER)`);
    expect(() => { migrateSimulationCurrencyCheck(db); }).toThrow();
    expect(tableSql()).toContain(`'EUR','USD','GBP'`);
    expect(db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM simulations').get()?.n).toBe(2);
  });
});
