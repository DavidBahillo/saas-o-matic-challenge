// Migración de la 004 (RF20, CA6): bases de la 003 pasan a EUR de forma idempotente.
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedLegacyDatabase } from '../../test/helpers/legacy-db';
import { openDatabase } from '../db/connection';
import { createSimulationsRepository } from './simulations.repository';
import { migrate } from './schema';

let db: Database.Database;

function seedOldDatabase(): void {
  seedLegacyDatabase(db);
}

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

describe('migrate sobre una base de la 003 (RF20)', () => {
  it('las simulaciones salen como EUR con tipo 1.000000 y convertidos iguales a los de euros', () => {
    seedOldDatabase();
    migrate(db);
    const items = createSimulationsRepository(db).listByCustomer(1);
    expect(items.map((s) => s.id)).toEqual([2, 1]);
    for (const s of items) {
      expect(s).toMatchObject({
        currency: 'EUR',
        exchangeRate: '1.000000',
        exchangeRateAt: s.createdAt,
        baseCents: 14000,
        vatCents: 2940,
        totalCents: 16940,
        convertedBaseCents: 14000,
        convertedVatCents: 2940,
        convertedTotalCents: 16940,
      });
    }
  });

  it('ejecutar migrate dos veces no falla ni cambia los datos', () => {
    seedOldDatabase();
    migrate(db);
    const first = createSimulationsRepository(db).listByCustomer(1);
    expect(() => {
      migrate(db);
    }).not.toThrow();
    expect(createSimulationsRepository(db).listByCustomer(1)).toEqual(first);
  });

  it('mantiene la tabla customers y la FK ON DELETE RESTRICT', () => {
    seedOldDatabase();
    migrate(db);
    expect(db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM customers').get()?.n).toBe(1);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    const fks = db.pragma('foreign_key_list(simulations)') as { on_delete: string; table: string }[];
    expect(fks).toEqual([expect.objectContaining({ table: 'customers', on_delete: 'RESTRICT' })]);
    expect(() => db.prepare('DELETE FROM customers WHERE id = 1').run()).toThrow(/FOREIGN KEY/);
  });

  it('las simulaciones nuevas siguen añadiéndose tras migrar', () => {
    seedOldDatabase();
    migrate(db);
    const repo = createSimulationsRepository(db);
    const base = repo.findById(1);
    if (base === undefined) throw new Error('falta la simulación 1');
    const { exchangeRate, id, ...rest } = base;
    expect([id, exchangeRate]).toEqual([1, '1.000000']);
    expect(repo.insert({ ...rest, exchangeRateMicros: 1_100_000, currency: 'USD' }).id).toBe(3);
  });
});

describe('migrate sobre una base nueva', () => {
  it('las seis columnas nuevas son NOT NULL', () => {
    migrate(db);
    const cols = db.pragma('table_info(simulations)') as { name: string; notnull: number }[];
    const names = [
      'currency',
      'exchange_rate_micros',
      'exchange_rate_at',
      'converted_base_cents',
      'converted_vat_cents',
      'converted_total_cents',
    ];
    for (const name of names) expect(cols.find((c) => c.name === name)?.notnull).toBe(1);
  });

  it('migrate dos veces sobre una base nueva no falla', () => {
    migrate(db);
    expect(() => {
      migrate(db);
    }).not.toThrow();
  });
});
