// Utilidades HTTP de la 003 (T8–T9): app de pruebas con clientes 7 (ES) y 8 (US), POST con
// JSON crudo (para claves duplicadas y -0) y recuento de filas de simulaciones (CA3).
import request from 'supertest';
import { createTestApp } from './test-app';
import type { TestApp } from './test-app';

export interface SimulationsTestApp extends TestApp {
  countSimulations(): number;
}

/** Clientes 7 (ES) y 8 (US); el 999 no existe. */
export function createSimulationsTestApp(): SimulationsTestApp {
  const t = createTestApp();
  insertCustomerRow(t, 7, 'ES');
  insertCustomerRow(t, 8, 'US');
  const countStmt = t.db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM simulations');
  return { ...t, countSimulations: () => countStmt.get()?.n ?? 0 };
}

/** Inserta un cliente con el id, país y plan indicados (sin validar el país). */
export function insertCustomerRow(t: TestApp, id: number, country: string, plan = 'starter'): void {
  t.db
    .prepare(
      `INSERT INTO customers (id, company_name, company_name_search, tax_id, tax_id_type, email,
       country, plan, created_at) VALUES (?, ?, ?, ?, 'OTHER', 'a@example.com', ?, ?, ?)`,
    )
    .run(
      id,
      `Cliente ${String(id)}`,
      `cliente ${String(id)}`,
      `T${String(id)}X`,
      country,
      plan,
      '2026-11-12T10:00:00.000Z',
    );
}

/** POST /simulations con el texto JSON tal cual. */
export function postRaw(t: TestApp, raw: string): request.Test {
  return request(t.app).post('/simulations').set('Content-Type', 'application/json').send(raw);
}

export function postSimulation(t: TestApp, body: unknown): request.Test {
  return postRaw(t, JSON.stringify(body));
}

export interface FieldError {
  field: string;
  code: string;
  reason?: string;
}

/** Errores de campo reducidos a field, code y reason. */
export function fieldsOf(res: request.Response): FieldError[] {
  const body = res.body as { error: { details?: { fields?: FieldError[] } } };
  return (body.error.details?.fields ?? []).map(({ field, code, reason }) =>
    reason === undefined ? { field, code } : { field, code, reason },
  );
}
