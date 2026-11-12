// Persistencia tras reiniciar a través de la API (T10, RF32 y CA4). Cada "arranque" repite el
// cableado de server.ts (loadConfig → openDatabase → migrate → createApp) sobre un archivo
// temporal en os.tmpdir(); "reiniciar" es cerrar la BD y volver a arrancar con el mismo DB_PATH.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { openDatabase } from '../src/db/connection';
import { migrate } from '../src/repositories/schema';
import { CONTRACT_REQUEST } from './helpers/test-app';

interface Running {
  app: Express;
  db: Database.Database;
}

let tempDir: string;
let dbPath: string;
let running: Running | undefined;

function start(): Running {
  const config = loadConfig({ DB_PATH: dbPath });
  const db = openDatabase(config.dbPath);
  migrate(db);
  running = { app: createApp({ db }), db };
  return running;
}

function restart(): Running {
  running?.db.close();
  return start();
}

function post(app: Express, body: unknown = CONTRACT_REQUEST): request.Test {
  return request(app).post('/customers').set('Content-Type', 'application/json').send(JSON.stringify(body));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'saas-o-matic-persist-'));
  dbPath = join(tempDir, 'data', 'saas-o-matic.db');
});

afterEach(() => {
  running?.db.close();
  running = undefined;
  rmSync(tempDir, { recursive: true, force: true });
});

describe('RF32 · los clientes siguen ahí tras reiniciar (CA4)', () => {
  it('GET /customers/:id devuelve exactamente los datos normalizados del 201 tras reiniciar', async () => {
    const created = await post(start().app);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: 1, taxId: 'B12345674', email: 'compras@acme.es', country: 'ES' });

    const { app } = restart();
    const byId = await request(app).get('/customers/1');
    expect(byId.status).toBe(200);
    expect(byId.body).toEqual(created.body);
    const list = await request(app).get('/customers').query({ q: 'IBÉRICA' });
    expect(list.body).toEqual({ items: [created.body], total: 1 });
  });

  it('tras reiniciar, la unicidad se mantiene (409) y los ids continúan', async () => {
    await post(start().app);
    const { app } = restart();
    const duplicate = await post(app, { ...CONTRACT_REQUEST, taxId: 'B-1234567-4' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({ error: { code: 'CUSTOMER_ALREADY_EXISTS', details: { existingId: 1 } } });
    const second = await post(app, { ...CONTRACT_REQUEST, taxId: '12345678Z' });
    expect(second.status).toBe(201);
    expect(second.body).toMatchObject({ id: 2 });
  });

  it('varios reinicios seguidos conservan todos los clientes', async () => {
    await post(start().app);
    await post(restart().app, { ...CONTRACT_REQUEST, country: 'GB', taxId: '980780684' });
    const list = await request(restart().app).get('/customers');
    expect(list.body).toMatchObject({ total: 2 });
  });

  it('una petición rechazada no deja filas, ni siquiera tras reiniciar (CA5)', async () => {
    const rejected = await post(start().app, { ...CONTRACT_REQUEST, taxId: 'B12345675' });
    expect(rejected.status).toBe(400);
    const list = await request(restart().app).get('/customers');
    expect(list.body).toEqual({ items: [], total: 0 });
  });
});
