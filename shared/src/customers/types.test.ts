import { describe, expect, it } from 'vitest';
import { TAX_ID_TYPES } from './types';

describe('TAX_ID_TYPES', () => {
  it('contiene los tipos del Glosario', () => {
    expect(TAX_ID_TYPES).toEqual([
      'DNI', 'NIE', 'CIF', 'PT_NIF', 'FR_SIREN', 'DE_VAT', 'IT_PIVA', 'GB_VAT', 'OTHER',
    ]);
  });
});
