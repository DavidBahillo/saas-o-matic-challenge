// Esquema del cuerpo de POST /simulations (T7, RF5–RF9).
import { describe, expect, it } from 'vitest';
import { parseCreateSimulationBody } from './simulation-body.schema';

describe('parseCreateSimulationBody', () => {
  it('un cuerpo válido sin recursos da storage y apiCalls 0 (RF4)', () => {
    expect(parseCreateSimulationBody({ customerId: 7, users: 15 })).toEqual({
      ok: true,
      value: { customerId: 7, users: 15, storage: 0, apiCalls: 0 },
    });
  });

  it.each([[[]], [null], ['x'], [42]])('%j no es un objeto → INVALID_TYPE en body (RF9)', (body) => {
    const result = parseCreateSimulationBody(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual([expect.objectContaining({ field: 'body', code: 'INVALID_TYPE' })]);
  });

  it('agrega los errores en el orden de la validación compartida (RF5)', () => {
    const result = parseCreateSimulationBody({ customerId: 'x', users: -1, storage: -1, foo: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((e) => [e.field, e.code])).toEqual([
        ['customerId', 'INVALID_TYPE'],
        ['users', 'INVALID_USERS'],
        ['storage', 'INVALID_RESOURCE'],
        ['foo', 'UNKNOWN_FIELD'],
      ]);
    }
  });

  it('un __proto__ propio de JSON.parse es UNKNOWN_FIELD', () => {
    const result = parseCreateSimulationBody(JSON.parse('{"customerId":1,"users":1,"__proto__":1}'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual([expect.objectContaining({ field: '__proto__', code: 'UNKNOWN_FIELD' })]);
  });
});
