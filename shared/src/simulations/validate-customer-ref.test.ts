import { describe, expect, it } from 'vitest';
import { CUSTOMER_REF_MESSAGES, validateCustomerRef } from './validate-customer-ref';

const err = (code: 'REQUIRED' | 'INVALID_TYPE' | 'INVALID_ID') => ({
  ok: false,
  error: { field: 'customerId', code, message: CUSTOMER_REF_MESSAGES[code] },
});

describe('validateCustomerRef (RF6)', () => {
  it.each([1, 7, Number.MAX_SAFE_INTEGER])('%d es válido', (raw) => {
    expect(validateCustomerRef(raw)).toEqual({ ok: true, value: raw });
  });

  it.each([undefined, null])('%s da REQUIRED', (raw) => {
    expect(validateCustomerRef(raw)).toEqual(err('REQUIRED'));
  });

  it.each(['7', true, {}])('%j da INVALID_TYPE', (raw) => {
    expect(validateCustomerRef(raw)).toEqual(err('INVALID_TYPE'));
  });

  it.each([0, -0, -1, 1.5, 9007199254740992, Number.NaN])('%d da INVALID_ID', (raw) => {
    expect(validateCustomerRef(raw)).toEqual(err('INVALID_ID'));
  });
});
