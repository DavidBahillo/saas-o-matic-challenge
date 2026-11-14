// Migración de la 009 (RF23, CA9): simulations pasa de ON DELETE RESTRICT a ON DELETE CASCADE.
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedLegacyDatabase } from '../../test/helpers/legacy-db';
import { openDatabase } from '../db/connection';
import { migrate } from './schema';
import { migrateSimulationsCascade } from './simulations-cascade-migration';
import { createSimulationsRepository } from './simulations.repository';

let db: Database.Database;

function tableSql(): string {
  return db.prepare<[], { sql: string }>(`SELECT sql FROM sqlite_master WHERE name = 'simulations'`).get()?.sql ?? '';
}

function onDelete(): string[] {
  return (db.pragma('foreign_key_list(simulations)') as { on_delete: string }[]).map((fk) => fk.on_delete);
}

function count(table: string): number {
  return db.prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n ?? -1;
}

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

describe('migrateSimulationsCascade', () => {
  it('una BD legada con RESTRICT pasa a CASCADE conservando filas e ids', () => {
    seedLegacyDatabase(db);
    migrate(db);
    expect(onDelete()).toEqual(['CASCADE']);
    expect(createSimulationsRepository(db).listByCustomer(1).map((s) => s.id)).toEqual([2, 1]);
    expect(count('customers')).toBe(1);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    const index = db.prepare(`SELECT name FROM sqlite_master WHERE name = 'simulations_customer_created_idx'`).get();
    expect(index).toBeDefined();
  });

  it('con CASCADE, borrar el cliente borra sus simulaciones', () => {
    seedLegacyDatabase(db);
    migrate(db);
    expect(db.prepare('DELETE FROM customers WHERE id = 1').run().changes).toBe(1);
    expect(count('simulations')).toBe(0);
  });

  it('es idempotente: un segundo migrate no cambia nada', () => {
    seedLegacyDatabase(db);
    migrate(db);
    const sql = tableSql();
    const rows = createSimulationsRepository(db).listByCustomer(1);
    migrateSimulationsCascade(db);
    migrate(db);
    expect(tableSql()).toBe(sql);
    expect(createSimulationsRepository(db).listByCustomer(1)).toEqual(rows);
  });

  it('una BD nueva nace con CASCADE y no se reconstruye', () => {
    migrate(db);
    expect(onDelete()).toEqual(['CASCADE']);
    expect(tableSql()).not.toContain('RESTRICT');
  });

  it('sin tabla simulations no hace nada', () => {
    expect(() => { migrateSimulationsCascade(db); }).not.toThrow();
  });
});
