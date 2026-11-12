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
