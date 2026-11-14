import { describe, expect, it } from 'vitest';
import { formatDateOnly } from './format-since';

describe('formatDateOnly', () => {
  it('muestra solo la fecha, sin hora', () => {
    expect(formatDateOnly('2026-11-13T10:00:00.000Z')).toBe('13 nov 2026');
    expect(formatDateOnly('2026-01-05T10:00:00.000Z')).toBe('5 ene 2026');
  });
});
