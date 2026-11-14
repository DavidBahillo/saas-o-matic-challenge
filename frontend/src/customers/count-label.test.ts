import { describe, expect, it } from 'vitest';
import { customersCountLabel } from './count-label';

describe('customersCountLabel', () => {
  it.each([
    [0, '0 clientes'],
    [1, '1 cliente'],
    [2, '2 clientes'],
    [10, '10 clientes'],
    [73, '73 clientes'],
    [101, '101 clientes'],
  ])('%i -> %s', (count, label) => {
    expect(customersCountLabel(count)).toBe(label);
  });
});
