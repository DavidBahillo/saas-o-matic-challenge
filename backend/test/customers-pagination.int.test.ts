// GET /customers?q=&page= (009, RF1, RF4, RF5): normalización de `page` y respuesta con página efectiva.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CustomerList } from '@saas-o-matic/shared';
import { createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { seedNames } from './helpers/seed-customers';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

async function list(query: string): Promise<CustomerList> {
  const res = await request(t.app).get(`/customers${query}`);
  expect(res.status).toBe(200);
  return res.body as CustomerList;
}

describe('page no válida → página 1, nunca 400', () => {
  it.each(['', '0', '-1', '1.5', '007', '1e1', '+2', 'abc', '99999999999999999999'])('page=%j', async (page) => {
    seedNames(t, Array.from({ length: 45 }, (_, i) => `Cliente ${String(i).padStart(2, '0')}`));
    const body = await list(`?page=${encodeURIComponent(page)}`);
    expect(body).toMatchObject({ page: 1, pageSize: 20, total: 45 });
    expect(body.items[0]?.companyName).toBe('Cliente 00');
  });

  it('page repetido o como objeto → página 1', async () => {
    seedNames(t, Array.from({ length: 45 }, (_, i) => `Cliente ${String(i).padStart(2, '0')}`));
    expect((await list('?page=2&page=3')).page).toBe(1);
    expect((await list('?page[a]=2')).page).toBe(1);
  });
});

describe('page fuera de rango y consultas combinadas', () => {
  it('page=999 con 3 páginas → última página (3)', async () => {
    seedNames(t, Array.from({ length: 45 }, (_, i) => `Cliente ${String(i).padStart(2, '0')}`));
    const body = await list('?page=999');
    expect(body).toMatchObject({ page: 3, total: 45 });
    expect(body.items).toHaveLength(5);
  });

  it('sin clientes → página 1, items vacío', async () => {
    expect(await list('?page=4')).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('q + page: 21 coincidencias, página 2 con 1 resultado', async () => {
    seedNames(t, [...Array.from({ length: 21 }, (_, i) => `Cliente ${String(i).padStart(2, '0')}`), 'Otra Empresa']);
    const body = await list('?q=cliente&page=2');
    expect(body).toMatchObject({ page: 2, total: 21 });
    expect(body.items).toHaveLength(1);
  });

  it('un q inválido sigue dando 400 VALIDATION_ERROR aunque page sea válido', async () => {
    const res = await request(t.app).get(`/customers?q=${'a'.repeat(101)}&page=2`);
    expect(res.status).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });
});
