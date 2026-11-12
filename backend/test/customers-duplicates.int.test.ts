// Unicidad por (país, tax ID normalizado) ante altas simultáneas (T10, RF21 y CA5). No se consulta
// antes de insertar: es el índice UNIQUE el que garantiza un único 201 (plan §6.3).
//
// Limitación (T11): better-sqlite3 es síncrono, así que dentro de un proceso los POST «en
// paralelo» se serializan en el bucle de eventos y estos tests no prueban una carrera real entre
// comprobar e insertar. Que el 409 sale de la constraint UNIQUE y no de una consulta previa lo
// demuestra src/services/customers.service.test.ts, con un repositorio que no ve la fila previa.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { Express } from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/connection';
import { createCustomersRepository } from '../src/repositories/customers.repository';
import { migrate } from '../src/repositories/schema';
import { CONTRACT_REQUEST, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

function post(app: Express, patch: Record<string, unknown> = {}): request.Test {
  return request(app)
    .post('/customers')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ ...CONTRACT_REQUEST, ...patch }));
}

/** Un único 201 y el resto 409 que apuntan al cliente creado. */
function expectOneCreated(responses: readonly request.Response[]): void {
  const created = responses.filter((r) => r.status === 201);
  const conflicts = responses.filter((r) => r.status === 409);
  expect(created).toHaveLength(1);
  expect(conflicts).toHaveLength(responses.length - 1);
  const id = (created[0]?.body as { id: number }).id;
  for (const conflict of conflicts) {
    expect(conflict.body).toEqual({
      error: {
        code: 'CUSTOMER_ALREADY_EXISTS',
        message: 'Ya existe un cliente con ese identificador fiscal en ES.',
        details: { existingId: id },
      },
    });
  }
}

describe('RF21 · existingId apunta al cliente duplicado', () => {
  it('A (id 1) y B (id 2); repetir B → 409 con existingId 2', async () => {
    const a = await post(t.app, { taxId: '12345678Z' });
    const b = await post(t.app, { taxId: 'B12345674' });
    expect([a.status, b.status]).toEqual([201, 201]);
    const repeated = await post(t.app, { taxId: 'b-1234567-4' });
    expect(repeated.status).toBe(409);
    expect(repeated.body).toEqual({
      error: {
        code: 'CUSTOMER_ALREADY_EXISTS',
        message: 'Ya existe un cliente con ese identificador fiscal en ES.',
        details: { existingId: 2 },
      },
    });
    expect(t.countCustomers()).toBe(2);
  });
});

describe('RF21 · altas simultáneas', () => {
  it('dos POST iguales en paralelo → exactamente un 201 y un 409, y queda 1 fila', async () => {
    const responses = await Promise.all([post(t.app), post(t.app)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expectOneCreated(responses);
    expect(t.countCustomers()).toBe(1);
  });

  it('el mismo tax ID con distinto formato en paralelo (B12345674 y b.1234567 4) → un 201', async () => {
    const responses = await Promise.all([post(t.app, { taxId: 'B12345674' }), post(t.app, { taxId: 'b.1234567 4' })]);
    expectOneCreated(responses);
    expect(t.countCustomers()).toBe(1);
  });

  it('diez POST iguales en paralelo → un 201 y nueve 409', async () => {
    const responses = await Promise.all(Array.from({ length: 10 }, () => post(t.app)));
    expectOneCreated(responses);
    expect(t.countCustomers()).toBe(1);
  });

  it('el mismo tax ID en GB y en US en paralelo → dos 201 (unicidad por país)', async () => {
    const responses = await Promise.all([
      post(t.app, { country: 'GB', taxId: '980780684' }),
      post(t.app, { country: 'US', taxId: '980780684' }),
    ]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(t.countCustomers()).toBe(2);
  });
});

describe('RF21 · dos conexiones sobre el mismo archivo (como dos procesos)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'saas-o-matic-dup-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('el índice UNIQUE de la BD da un 201 y un 409 aunque cada app tenga su conexión', async () => {
    const path = join(tempDir, 'shared.db');
    const [dbA, dbB] = [openDatabase(path), openDatabase(path)];
    migrate(dbA);
    migrate(dbB);
    try {
      const responses = await Promise.all([post(createApp({ db: dbA })), post(createApp({ db: dbB }))]);
      expectOneCreated(responses);
      expect(createCustomersRepository(dbA).search()).toHaveLength(1);
    } finally {
      dbA.close();
      dbB.close();
    }
  });
});
