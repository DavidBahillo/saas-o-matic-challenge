// Paridad API ↔ shared (T10, RF9 y CA3). Cada fila de las tablas de tax ID de la spec se envía a
// POST /customers y se comprueba que:
//   1. el estado es el de la spec (201 o 400);
//   2. la respuesta coincide exactamente con `validateCustomerInput` ejecutado fuera del servidor;
//   3. el resultado del campo taxId coincide con `validateTaxId` (tipo y valor, o código y reason).
// También cubre una muestra de "Otros campos" para comprobar la paridad del resto del alta.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateCountry, validateCustomerInput, validateTaxId } from '@saas-o-matic/shared';
import { CONTRACT_REQUEST, FIXED_NOW, VALIDATION_MESSAGE, createTestApp } from './helpers/test-app';
import type { TestApp } from './helpers/test-app';
import { ALL_TAX_ID_CASES, OMIT } from './helpers/taxid-cases';
import type { TaxIdCase, TaxIdInput } from './helpers/taxid-cases';

let t: TestApp;

beforeEach(() => {
  t = createTestApp();
});

afterEach(() => {
  t.close();
});

function bodyWith(country: string, taxId: TaxIdInput): Record<string, unknown> {
  const body: Record<string, unknown> = { ...CONTRACT_REQUEST, country };
  if (taxId === OMIT) delete body.taxId;
  else body.taxId = taxId;
  return body;
}

function fieldsOf(body: unknown): unknown[] {
  return (body as { error: { details: { fields: unknown[] } } }).error.details.fields;
}

/** El resultado del campo taxId en la API es el de validateTaxId (solo con país válido, RF8). */
function expectTaxIdParity(country: string, taxId: TaxIdInput, apiBody: unknown): void {
  const normalizedCountry = validateCountry(country);
  if (typeof taxId !== 'string' || !normalizedCountry.ok) return;
  const direct = validateTaxId(normalizedCountry.value, taxId);
  if (direct.ok) expect(apiBody).toMatchObject({ taxId: direct.value, taxIdType: direct.taxIdType });
  else expect(fieldsOf(apiBody)).toContainEqual({ field: 'taxId', ...direct.error });
}

/** La respuesta de la API es exactamente la que se deduce de validateCustomerInput. */
async function expectApiParity(body: Record<string, unknown>, status: 201 | 400): Promise<request.Response> {
  const expected = validateCustomerInput(body);
  const res = await request(t.app).post('/customers').set('Content-Type', 'application/json').send(JSON.stringify(body));
  expect(res.status).toBe(status);
  if (expected.ok) {
    expect(res.body).toEqual({ id: 1, ...expected.value, createdAt: FIXED_NOW, simulationCount: 0 });
    expect(t.countCustomers()).toBe(1);
  } else {
    expect(res.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: VALIDATION_MESSAGE, details: { fields: expected.errors } },
    });
    expect(t.countCustomers()).toBe(0);
  }
  return res;
}

/** El resultado coincide con el de la spec: taxIdType del 201, o code, reason y taxIdType del 400. */
function expectSpecResult(apiBody: unknown, spec: TaxIdCase[3]): void {
  if (typeof spec === 'string') {
    expect(apiBody).toMatchObject({ taxIdType: spec });
    return;
  }
  const { field = 'taxId', ...expected } = spec;
  const error = fieldsOf(apiBody).find((e) => typeof e === 'object' && e !== null && 'field' in e && e.field === field);
  // Solo code, reason y taxIdType; una clave de más o de menos respecto a la spec hace fallar.
  const picked: Record<string, unknown> | undefined =
    typeof error === 'object' && error !== null
      ? Object.fromEntries(Object.entries(error).filter(([key]) => SPEC_KEYS.includes(key)))
      : undefined;
  expect(picked).toStrictEqual(expected);
}

const SPEC_KEYS: readonly string[] = ['code', 'reason', 'taxIdType'];

describe.each(ALL_TAX_ID_CASES)('RF9 · paridad del tax ID (%s)', (_group, cases) => {
  it.each(cases)('%j + %j → %i, igual que shared y que la spec', async (country, taxId, status, spec) => {
    const res = await expectApiParity(bodyWith(country, taxId), status);
    expectTaxIdParity(country, taxId, res.body);
    expectSpecResult(res.body, spec);
  });
});

describe('RF2 · la normalización del tax ID se aplica una sola vez (T11)', () => {
  it.each([
    ['ES', '12345678Z\n-'],
    ['US', '-\n-'],
  ])('%s + %j está en la paridad con TAX_ID_INVALID_FORMAT', (country, taxId) => {
    const row = ALL_TAX_ID_CASES.flatMap(([, cases]) => cases).find(([c, id]) => c === country && id === taxId);
    expect(row).toEqual([country, taxId, 400, { code: 'TAX_ID_INVALID_FORMAT' }]);
  });
});

describe('RF9 · cobertura mínima de la paridad (CA3)', () => {
  it.each(ALL_TAX_ID_CASES.slice(0, 7))('%s tiene al menos 2 filas válidas y 2 no válidas', (_group, cases) => {
    expect(cases.filter(([, , status]) => status === 201).length).toBeGreaterThanOrEqual(2);
    expect(cases.filter(([, , status]) => status === 400).length).toBeGreaterThanOrEqual(2);
  });
});

describe('RF9 · paridad del resto de campos ("Otros campos")', () => {
  const ACUTE = String.fromCodePoint(0x301);
  it.each([
    ['companyName de 1 code point', { companyName: 'A' }, 400],
    ['companyName de 120 é en NFD', { companyName: `e${ACUTE}`.repeat(120) }, 201],
    ['companyName con salto de línea', { companyName: 'Acme\nIbérica' }, 400],
    ['companyName con emoji', { companyName: `Acme ${String.fromCodePoint(0x1f600)}` }, 201],
    ['email con dominio no ASCII', { email: 'ventas@acmé.es' }, 400],
    ['email de 254 code points', { email: `${'a'.repeat(246)}@acme.es` }, 201],
    ['email de 255 code points', { email: `${'a'.repeat(247)}@acme.es` }, 400],
    ['plan Starter', { plan: 'Starter' }, 400],
    ['plan " growth "', { plan: ' growth ' }, 201],
    ['país UK con sugerencia', { country: 'UK' }, 400],
    ['campo extra discount', { discount: 10 }, 400],
    ['varios campos a la vez', { companyName: null, email: 'a@@b.es', plan: 'pro' }, 400],
  ] as const)('%s', async (_label, patch, status) => {
    await expectApiParity({ ...CONTRACT_REQUEST, ...patch }, status);
  });
});
