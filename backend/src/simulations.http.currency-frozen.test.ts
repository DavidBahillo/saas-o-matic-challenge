// Congelación, lecturas y migración (004): tabla "Congelación y migración" y CA5, CA6.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { openDatabase } from './db/connection';
import { migrate } from './repositories/schema';
import { seedLegacyDatabase } from '../test/helpers/legacy-db';
import { createFakeRates } from '../test/helpers/fake-rates';
import { FIXED_NOW } from '../test/helpers/test-app';
import { createSimulationsTestApp, postSimulation } from '../test/helpers/simulations-app';
import type { SimulationsTestApp } from '../test/helpers/simulations-app';

let t: SimulationsTestApp;
const DAY = 86_400_000;

beforeEach(() => {
  t = createSimulationsTestApp();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  t.close();
  vi.restoreAllMocks();
});

const get = (path: string) => request(t.app).get(path);

describe('congelación (RF19)', () => {
  it('cambiar el tipo y expirar la caché no altera lo guardado ni llama a la API', async () => {
    const created = await postSimulation(t, { customerId: 7, users: 15, currency: 'USD' });
    t.rates.answers.USD = '1.2';
    t.setNow(new Date(new Date(FIXED_NOW).getTime() + 2 * DAY));
    const res = await get('/simulations/1');
    expect(res.body).toEqual(created.body);
    expect(res.body).toMatchObject({ exchangeRate: '1.100000', convertedTotalCents: 18634 });
    expect(t.rates.calls).toHaveLength(1);
  });

  it('una fila con convertedBaseCents 99900 que no cuadra con su tipo se lee con 99900', async () => {
    await postSimulation(t, { customerId: 7, users: 15, currency: 'USD' });
    t.db.prepare('UPDATE simulations SET converted_base_cents = 99900 WHERE id = 1').run();
    expect((await get('/simulations/1')).body).toMatchObject({ convertedBaseCents: 99900 });
  });

  it('GET /simulations/:id?currency=GBP ignora los parámetros', async () => {
    const created = await postSimulation(t, { customerId: 7, users: 3, currency: 'USD' });
    expect((await get('/simulations/1?currency=GBP')).body).toEqual(created.body);
  });

  it('el listado de un cliente con EUR, USD y GBP trae cada divisa y tipo, de más reciente a más antigua', async () => {
    await postSimulation(t, { customerId: 7, users: 1 });
    await postSimulation(t, { customerId: 7, users: 2, currency: 'USD' });
    await postSimulation(t, { customerId: 7, users: 3, currency: 'GBP' });
    t.db.prepare('UPDATE simulations SET created_at = ? WHERE id = ?').run('2026-11-13T00:00:00.000Z', 2);
    const items = (await get('/customers/7/simulations')).body as { items: Record<string, unknown>[] };
    expect(items.items.map((s) => [s['id'], s['currency'], s['exchangeRate']])).toEqual([
      [2, 'USD', '1.100000'],
      [3, 'GBP', '0.850000'],
      [1, 'EUR', '1.000000'],
    ]);
  });
});

describe('contrato de la 003 sin currency (CA5)', () => {
  it('es idéntico al anterior salvo por los campos nuevos de RF8', async () => {
    const res = await postSimulation(t, { customerId: 7, users: 15, storage: 50 });
    const NEW = ['currency', 'exchangeRate', 'exchangeRateAt', 'convertedBaseCents', 'convertedVatCents', 'convertedTotalCents'];
    const old = Object.fromEntries(Object.entries(res.body as object).filter(([k]) => !NEW.includes(k)));
    expect(Object.keys(old)).toEqual([
      'id', 'customerId', 'users', 'storage', 'apiCalls', 'tiers', 'baseCents', 'country',
      'vatRatePercent', 'vatCents', 'totalCents', 'createdAt',
    ]);
    expect(old).toMatchObject({ id: 1, storage: 50, baseCents: 14000, vatCents: 2940, totalCents: 16940 });
  });
});

describe('migración al arrancar sobre una base de la 003 (RF20, CA6)', () => {
  it('las simulaciones salen como EUR y migrar dos veces no cambia nada', async () => {
    const db = openDatabase(':memory:');
    try {
      seedLegacyDatabase(db);
      migrate(db);
      const app = createApp({ db, rateProvider: createFakeRates().provider });
      const first = (await request(app).get('/customers/1/simulations')).body as { items: Record<string, unknown>[] };
      migrate(db);
      const second: unknown = (await request(app).get('/customers/1/simulations')).body;
      expect(second).toEqual(first);
      expect(first.items.map((s) => s['id'])).toEqual([2, 1]);
      expect(first.items[0]).toMatchObject({
        currency: 'EUR', exchangeRate: '1.000000', exchangeRateAt: '2026-11-03T10:00:00.000Z',
        baseCents: 14000, convertedBaseCents: 14000, convertedVatCents: 2940, convertedTotalCents: 16940,
      });
    } finally {
      db.close();
    }
  });
});
