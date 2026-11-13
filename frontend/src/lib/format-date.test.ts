import { describe, expect, it } from 'vitest';
import { formatClock, formatDateTime, oldestRateAt } from './format-date';

describe('formatDateTime y formatClock (V5, V8; TZ=UTC en los tests)', () => {
  it('formatea fecha y hora en es-ES', () => {
    expect(formatDateTime('2026-11-13T09:30:00.000Z')).toBe('13 nov 2026, 09:30');
  });

  it('formatea la hora en 24 h', () => {
    expect(formatClock('2026-11-13T09:00:00.000Z')).toBe('09:00');
    expect(formatClock('2026-11-13T21:05:00.000Z')).toBe('21:05');
  });
});

describe('oldestRateAt', () => {
  it('devuelve la hora más antigua', () => {
    const items = [
      { exchangeRateAt: '2026-11-13T09:30:00.000Z' },
      { exchangeRateAt: '2026-11-13T09:00:00.000Z' },
    ];
    expect(oldestRateAt(items)).toBe('2026-11-13T09:00:00.000Z');
  });

  it('sin tipos no hay hora', () => {
    expect(oldestRateAt([])).toBeUndefined();
  });
});
