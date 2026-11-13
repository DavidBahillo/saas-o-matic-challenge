// Spec 006 · T2 (CA5): los datos semilla se leen desde la API real y simulationCount coincide con cada lista.
import type Database from 'better-sqlite3';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/connection';
import { migrate } from '../src/repositories/schema';
import { runSeed } from '../src/seed/run-seed';

let db: Database.Database;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  db = openDatabase(':memory:');
  migrate(db);
  await runSeed(db);
  app = createApp({
    db,
    rateProvider: {
      fetchRate: () => {
        throw new Error('sin red');
      },
    },
  });
});

afterEach(() => {
  db.close();
});

interface CustomerItem {
  id: number;
  companyName: string;
  simulationCount: number;
}

describe('datos semilla vía API', () => {
  it('GET /customers lista 9 y simulationCount coincide con GET /customers/:id/simulations', async () => {
    const res = await request(app).get('/customers');
    expect(res.status).toBe(200);
    const items = (res.body as { items: CustomerItem[] }).items;
    expect(items).toHaveLength(9);
    let total = 0;
    for (const c of items) {
      const list = await request(app).get(`/customers/${String(c.id)}/simulations`);
      expect(list.status).toBe(200);
      expect((list.body as { items: unknown[] }).items).toHaveLength(c.simulationCount);
      total += c.simulationCount;
    }
    expect(total).toBe(14);
    expect(items.some((c) => c.simulationCount === 0)).toBe(true);
    expect(items.some((c) => c.simulationCount > 1)).toBe(true);
  });

  it('GET /simulations/:id en USD devuelve el tipo 1,10 congelado', async () => {
    const res = await request(app).get('/simulations/7');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      currency: 'USD',
      exchangeRate: '1.100000',
      exchangeRateAt: '2026-01-01T00:00:00.000Z',
      convertedVatCents: 9818,
      convertedTotalCents: 56568,
    });
  });
});
