// GET /customers?q= (T9): filtro por nombre y por tax ID (RF23), parámetros (RF24) y sin
// resultados (RF25). Filas de la tabla "Búsqueda y consulta" de la spec 001.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CustomerList } from '@saas-o-matic/shared';
import { VALIDATION_MESSAGE, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { seedCustomer, seedNames } from './helpers/seed-customers';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
  seedCustomer(t, { companyName: 'Acme Ibérica SL', taxId: 'B12345674', country: 'ES' });
  seedCustomer(t, { companyName: 'Straße GmbH' });
  seedCustomer(t, { companyName: 'Coca-Cola España SA' });
  seedCustomer(t, { companyName: 'Persona Física', taxId: '12345678Z', country: 'ES' });
  seedNames(t, ['100% Natural SL', 'Foo_Bar SA', 'FooXBar SA', '100X Natural SL']);
});

afterEach(() => {
  t.close();
});

async function search(path: string): Promise<CustomerList> {
  const res = await request(t.app).get(path);
  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toMatch(/^application\/json/);
  return res.body as CustomerList;
}

async function namesFor(q: string): Promise<string[]> {
  const body = await search(`/customers?q=${encodeURIComponent(q)}`);
  expect(body.total).toBe(body.items.length);
  return body.items.map((c) => c.companyName);
}

const COMBINING_ACUTE = String.fromCodePoint(0x0301);
const NBSP = String.fromCodePoint(0x00a0);
const EMOJI = String.fromCodePoint(0x1f600);

describe('RF23 · búsqueda por nombre', () => {
  it('q=acme devuelve el cliente completo con la forma del contrato', async () => {
    const body = await search('/customers?q=acme');
    expect(body).toEqual({
      items: [
        {
          id: 1,
          companyName: 'Acme Ibérica SL',
          taxId: 'B12345674',
          taxIdType: 'CIF',
          email: 'compras@example.com',
          country: 'ES',
          plan: 'starter',
          createdAt: '2026-11-12T10:00:00.000Z',
          simulationCount: 0,
        },
      ],
      total: 1,
    });
  });

  it.each(['ACME', '  acme  ', 'IBÉRICA', `Ibe${COMBINING_ACUTE}rica`, `${NBSP}acme${NBSP}`])(
    'q=%j encuentra "Acme Ibérica SL"',
    async (q) => {
      expect(await namesFor(q)).toEqual(['Acme Ibérica SL']);
    },
  );

  it.each(['iberica', 'STRASSE', 'strasse'])('q=%j no encuentra nada (sin quitar tildes ni case folding)', async (q) => {
    expect(await namesFor(q)).toEqual([]);
  });

  it('q=STRAßE sí encuentra "Straße GmbH"', async () => {
    expect(await namesFor('STRAßE')).toEqual(['Straße GmbH']);
  });

  it('q=- encuentra solo por nombre (el tax ID normalizado queda vacío)', async () => {
    expect(await namesFor('-')).toEqual(['Coca-Cola España SA']);
  });

  it.each([
    ['%', ['100% Natural SL']],
    ['_', ['Foo_Bar SA']],
    ['0%', ['100% Natural SL']],
  ])('q=%j se trata como texto literal', async (q, expected) => {
    expect(await namesFor(q)).toEqual(expected);
  });
});

describe('RF23 · búsqueda por tax ID', () => {
  it.each(['12.345.678', '12345678z', '345-678', 'b1234'])('q=%j se normaliza como tax ID', async (q) => {
    const names = await namesFor(q);
    expect(names).toHaveLength(1);
    expect(['Persona Física', 'Acme Ibérica SL']).toContain(names[0]);
  });

  it('q=12.345.678 encuentra 12345678Z', async () => {
    const body = await search('/customers?q=12.345.678');
    expect(body.items.map((c) => c.taxId)).toEqual(['12345678Z']);
  });
});

describe('RF24/RF25 · sin q, q vacío y sin resultados', () => {
  it.each(['/customers', '/customers?q=', '/customers?q=%20%20%20', '/customers?q=%C2%A0%09'])(
    '%s devuelve todos los clientes',
    async (path) => {
      const body = await search(path);
      expect(body.total).toBe(8);
      expect(body.items).toHaveLength(8);
    },
  );

  it('sin coincidencias → 200 con items vacío y total 0, nunca 404', async () => {
    expect(await search('/customers?q=zzzz')).toEqual({ items: [], total: 0 });
  });

  it('sin clientes guardados → 200 con items vacío y total 0', async () => {
    t.db.prepare('DELETE FROM customers').run();
    expect(await search('/customers')).toEqual({ items: [], total: 0 });
  });

  it.each(['/customers?foo=1', '/customers?q=acme&_=123', '/customers?q=acme&q2[]=x&foo[a]=b'])(
    '%s ignora los parámetros desconocidos',
    async (path) => {
      const body = await search(path);
      expect(body.total).toBe(path.includes('acme') ? 1 : 8);
    },
  );
});

describe('RF24 · validación de q', () => {
  function expectFieldError(body: unknown, code: string): void {
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: VALIDATION_MESSAGE,
        details: { fields: [{ field: 'q', code, message: expect.any(String) as string }] },
      },
    });
  }

  it.each(['a'.repeat(100), `  ${'a'.repeat(100)}  `, EMOJI.repeat(100), `${NBSP}${EMOJI.repeat(100)}`])(
    'q de 100 code points tras el trim → 200 (caso %#)',
    async (q) => {
      const res = await request(t.app).get('/customers').query({ q });
      expect(res.status).toBe(200);
    },
  );

  it.each(['a'.repeat(101), `  ${'a'.repeat(101)}  `, EMOJI.repeat(101)])(
    'q de 101 code points tras el trim → 400 INVALID_LENGTH (caso %#)',
    async (q) => {
      const res = await request(t.app).get('/customers').query({ q });
      expect(res.status).toBe(400);
      expectFieldError(res.body, 'INVALID_LENGTH');
    },
  );

  it.each(['q=a&q=b', 'q[]=a', 'q[a]=b', 'q=&q=', 'q[0]=a'])('?%s → 400 INVALID_TYPE en q', async (qs) => {
    const res = await request(t.app).get(`/customers?${qs}`);
    expect(res.status).toBe(400);
    expectFieldError(res.body, 'INVALID_TYPE');
  });
});
