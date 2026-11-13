// CA3, RF25: la solicitud lleva solo cinco claves y nunca importes ni tipos.
import { describe, expect, it } from 'vitest';
import { buildSimulationRequest } from './request';

describe('buildSimulationRequest', () => {
  it('lleva solo customerId, users, storage, apiCalls y currency', () => {
    const request = buildSimulationRequest(7, { users: 15, storage: 3, apiCalls: 40, extra: 'x' } as never, 'USD');
    expect(Object.keys(request).sort()).toEqual(['apiCalls', 'currency', 'customerId', 'storage', 'users']);
    expect(request).toEqual({ customerId: 7, users: 15, storage: 3, apiCalls: 40, currency: 'USD' });
  });
});
