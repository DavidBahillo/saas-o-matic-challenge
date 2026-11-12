// GET /customers: orden con la colación española, desempate por id y máximo de 50 resultados
// con `total` de todas las coincidencias (T9, RF24). Filas de "Búsqueda y consulta" de la spec 001.
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

async function list(path: string): Promise<CustomerList> {
  const res = await request(t.app).get(path);
  expect(res.status).toBe(200);
  return res.body as CustomerList;
}

function labels(body: CustomerList): string[] {
  return body.items.map((c) => `${c.companyName}#${String(c.id)}`);
}

describe('RF24 · orden con colación española', () => {
  it.each([
    {
      row: '"Bravo" (1), "Álvarez" (2) → Álvarez, Bravo',
      names: ['Bravo', 'Álvarez'],
      expected: ['Álvarez#2', 'Bravo#1'],
    },
    {
      row: '"Ñandú" (1), "Nube" (2), "Nzeta" (3), "Oasis" (4) → Nube, Nzeta, Ñandú, Oasis',
      names: ['Ñandú', 'Nube', 'Nzeta', 'Oasis'],
      expected: ['Nube#2', 'Nzeta#3', 'Ñandú#1', 'Oasis#4'],
    },
    {
      row: '"beta" (1), "acme" (2), "Acme" (3), "Ábaco" (4) → Ábaco, acme, Acme, beta',
      names: ['beta', 'acme', 'Acme', 'Ábaco'],
      expected: ['Ábaco#4', 'acme#2', 'Acme#3', 'beta#1'],
    },
    {
      row: '"Ácme" (1), "acme" (2) → Ácme, acme (empate solo por tilde, desempate por id)',
      names: ['Ácme', 'acme'],
      expected: ['Ácme#1', 'acme#2'],
    },
  ])('$row', async ({ names, expected }) => {
    seedNames(t, names);
    expect(labels(await list('/customers'))).toEqual(expected);
  });

  it('el orden también se aplica a los resultados filtrados con q', async () => {
    seedNames(t, ['Zeta Acme', 'acme', 'Ábaco', 'Acme']);
    expect(labels(await list('/customers?q=acme'))).toEqual(['acme#2', 'Acme#4', 'Zeta Acme#1']);
  });
});

describe('RF24 · máximo de 50 resultados', () => {
  // "Zeta" se inserta primero (id 1) para que el límite dependa del orden y no del id.
  function seed51(): void {
    const others = Array.from({ length: 50 }, (_, i) => `Cliente ${String(i + 1).padStart(2, '0')}`);
    seedNames(t, ['Zeta Cliente', ...others]);
  }

  it.each(['/customers', '/customers?q=cliente'])(
    '%s con 51 coincidencias → 50 en items (sin "Zeta") y total 51',
    async (path) => {
      seed51();
      const body = await list(path);
      expect(body.total).toBe(51);
      expect(body.items).toHaveLength(50);
      expect(body.items.map((c) => c.companyName)).not.toContain('Zeta Cliente');
      expect(body.items[0]?.companyName).toBe('Cliente 01');
      expect(body.items[49]?.companyName).toBe('Cliente 50');
    },
  );

  it('con exactamente 50 coincidencias devuelve todas', async () => {
    seedNames(t, Array.from({ length: 50 }, (_, i) => `Cliente ${String(i).padStart(2, '0')}`));
    const body = await list('/customers');
    expect(body.total).toBe(50);
    expect(body.items).toHaveLength(50);
  });
});
