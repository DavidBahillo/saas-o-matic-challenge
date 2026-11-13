// Spec 006 · T2: runSeed con BD en memoria y sin red (CA1 a CA4).
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateQuote, convertQuote } from '@saas-o-matic/shared';
import { openDatabase } from '../db/connection';
import { createCustomersRepository } from '../repositories/customers.repository';
import { migrate } from '../repositories/schema';
import { createSimulationsRepository } from '../repositories/simulations.repository';
import { createCustomersService } from '../services/customers.service';
import { createSimulationsService } from '../services/simulations.service';
import { SEED_DATA } from './seed-data';
import { SEED_RATE_AT, createSeedRates } from './seed-rates';
import { SeedDataError, runSeed } from './run-seed';

let db: Database.Database;

beforeEach(() => {
  db = openDatabase(':memory:');
  migrate(db);
});

afterEach(() => {
  db.close();
  vi.unstubAllGlobals();
});

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

const sims = () => createSimulationsRepository(db);

describe('runSeed · base vacía (CA1, CA2)', () => {
  it('crea 9 clientes y 14 simulaciones sin usar la red', async () => {
    vi.stubGlobal('fetch', () => {
      throw new Error('sin red');
    });
    const summary = await runSeed(db);
    expect(summary).toEqual({ customersCreated: 9, customersExisting: 0, simulationsCreated: 14 });
    expect(count('customers')).toBe(9);
    expect(count('simulations')).toBe(14);
  });

  it.each([
    [1, 0, 0, 0],
    [2, 1000, 210, 1210],
    [3, 10000, 2100, 12100],
    [4, 10800, 2268, 13068],
    [5, 42000, 8820, 50820],
    [6, 42500, 8925, 51425],
    [10, 14000, 0, 14000],
  ])('simulación #%i: base %i, IVA %i, total %i céntimos', async (id, base, vat, total) => {
    await runSeed(db);
    expect(sims().findById(id)).toMatchObject({ baseCents: base, vatCents: vat, totalCents: total, currency: 'EUR' });
  });

  it('51 usuarios en USD con 1,10: 467,50 / 98,18 / 565,68 congelados', async () => {
    await runSeed(db);
    expect(sims().findById(7)).toMatchObject({
      currency: 'USD',
      exchangeRate: '1.100000',
      exchangeRateAt: SEED_RATE_AT,
      convertedBaseCents: 46750,
      convertedVatCents: 9818,
      convertedTotalCents: 56568,
    });
  });

  it('GBP congela 0,85 y coincide con convertQuote para todas las simulaciones', async () => {
    await runSeed(db);
    expect(sims().findById(8)).toMatchObject({ currency: 'GBP', exchangeRate: '0.850000', exchangeRateAt: SEED_RATE_AT });
    const customers = createCustomersRepository(db).search();
    SEED_DATA.simulations.forEach((s, index) => {
      const seed = SEED_DATA.customers.find((c) => c.key === s.customerKey);
      const stored = sims().findById(index + 1);
      const quote = calculateQuote({ users: s.users, country: seed?.country ?? '' });
      if (!quote.ok || stored === undefined) throw new Error(`simulación ${String(index + 1)}`);
      const micros = s.currency === 'EUR' ? 1_000_000 : s.currency === 'USD' ? 1_100_000 : 850_000;
      expect(stored).toMatchObject({ baseCents: quote.value.baseCents, totalCents: quote.value.totalCents });
      expect(stored).toMatchObject(convertQuote(quote.value, micros));
      expect(customers.some((c) => c.id === stored.customerId)).toBe(true);
      expect(s.storage).toBeLessThanOrEqual(1_000_000);
    });
  });
});

describe('runSeed · idempotencia (CA3, U7)', () => {
  it('la segunda ejecución no crea nada y los totales no cambian', async () => {
    await runSeed(db);
    const again = await runSeed(db);
    expect(again).toEqual({ customersCreated: 0, customersExisting: 9, simulationsCreated: 0 });
    expect(count('customers')).toBe(9);
    expect(count('simulations')).toBe(14);
  });

  it('cliente semilla ya existente: no se duplica, no se modifica, no recibe simulaciones y conserva las suyas', async () => {
    const now = () => new Date('2025-05-05T10:00:00.000Z');
    const repo = createCustomersRepository(db);
    const customers = createCustomersService(repo, now);
    const manual = customers.create({
      companyName: 'Nombre distinto', taxId: '12345678Z', taxIdType: 'DNI', email: 'otro@example.org', country: 'ES', plan: 'starter',
    });
    const other = customers.create({
      companyName: 'Otra empresa', taxId: '98765432M', taxIdType: 'DNI', email: 'o@example.org', country: 'ES', plan: 'growth',
    });
    const service = createSimulationsService({
      customers: repo, simulations: sims(), rates: createSeedRates(), now, runInTransaction: (fn) => db.transaction(fn)(),
    });
    await service.create({ customerId: manual.id, users: 3, storage: 1, apiCalls: 1, currency: 'EUR' });
    const before = JSON.stringify(repo.findById(manual.id));

    const summary = await runSeed(db);

    expect(summary).toEqual({ customersCreated: 8, customersExisting: 1, simulationsCreated: 7 });
    expect(count('customers')).toBe(10);
    expect(JSON.stringify(repo.findById(manual.id))).toBe(before);
    expect(sims().listByCustomer(manual.id)).toHaveLength(1);
    expect(sims().listByCustomer(other.id)).toHaveLength(0);
    expect(repo.findById(other.id)?.companyName).toBe('Otra empresa');
  });
});

describe('runSeed · todo o nada (CA4, RF2)', () => {
  it('un dato corrupto lanza SeedDataError y no toca la base', async () => {
    const [first, ...rest] = SEED_DATA.customers;
    if (first === undefined) throw new Error('sin clientes');
    const data = { ...SEED_DATA, customers: [{ ...first, taxId: '12345678A' }, ...rest] };
    const error = await runSeed(db, { data }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SeedDataError);
    expect((error as SeedDataError).issues[0]).toMatchObject({ subject: 'cliente es-dni', field: 'taxId' });
    expect(count('customers')).toBe(0);
    expect(count('simulations')).toBe(0);
  });

  it('un fallo a mitad (tipo de GBP que lanza) hace ROLLBACK', async () => {
    const real = createSeedRates();
    const rates = {
      ...real,
      getRate: (c: 'USD' | 'GBP') => (c === 'GBP' ? Promise.reject(new Error('GBP caído')) : real.getRate(c)),
    };
    await expect(runSeed(db, { rates })).rejects.toThrow('GBP caído');
    expect(count('customers')).toBe(0);
    expect(count('simulations')).toBe(0);
    expect(db.inTransaction).toBe(false);
  });
});
