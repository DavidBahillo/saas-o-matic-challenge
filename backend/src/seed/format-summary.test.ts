import { describe, expect, it } from 'vitest';
import { formatSummary } from './format-summary';

describe('formatSummary', () => {
  it('primera ejecución', () => {
    expect(formatSummary({ customersCreated: 9, customersExisting: 0, simulationsCreated: 14 })).toBe(
      'Clientes: 9 creados, 0 ya existentes\nSimulaciones: 14 creadas',
    );
  });

  it('segunda ejecución', () => {
    expect(formatSummary({ customersCreated: 0, customersExisting: 9, simulationsCreated: 0 })).toBe(
      'Clientes: 0 creados, 9 ya existentes\nSimulaciones: 0 creadas',
    );
  });
});
