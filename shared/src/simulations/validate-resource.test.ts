import { describe, expect, it } from 'vitest';
import { RESOURCE_MAX } from './types';
import { RESOURCE_MESSAGES, validateResource } from './validate-resource';

describe('validateResource (RF8)', () => {
  it.each(['storage', 'apiCalls'] as const)('%s ausente vale 0', (field) => {
    expect(validateResource(field, undefined)).toEqual({ ok: true, value: 0 });
  });

  it.each([0, 1, 50, RESOURCE_MAX])('%d es válido', (raw) => {
    expect(validateResource('storage', raw)).toEqual({ ok: true, value: raw });
  });

  it('-0 se normaliza a +0', () => {
    const result = validateResource('apiCalls', -0);
    expect(result.ok && Object.is(result.value, -0)).toBe(false);
    expect(result.ok && Object.is(result.value, 0)).toBe(true);
  });

  it.each([
    [-1, 'NEGATIVE'],
    [RESOURCE_MAX + 1, 'TOO_LARGE'],
    [2.5, 'NOT_INTEGER'],
    [-1.5, 'NOT_INTEGER'],
    [Number.NaN, 'NOT_INTEGER'],
    [Number.POSITIVE_INFINITY, 'NOT_INTEGER'],
  ] as const)('%d da INVALID_RESOURCE con %s', (raw, reason) => {
    expect(validateResource('storage', raw)).toEqual({
      ok: false,
      error: { field: 'storage', code: 'INVALID_RESOURCE', message: RESOURCE_MESSAGES[reason], reason },
    });
  });

  it.each([null, '50', true, {}])('%j da INVALID_TYPE', (raw) => {
    expect(validateResource('apiCalls', raw)).toEqual({
      ok: false,
      error: { field: 'apiCalls', code: 'INVALID_TYPE', message: RESOURCE_MESSAGES.INVALID_TYPE },
    });
  });
});
