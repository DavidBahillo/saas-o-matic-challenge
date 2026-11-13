import { describe, expect, it } from 'vitest';
import { simulationsLabel } from './pluralize';

describe('simulationsLabel (RF4)', () => {
  it('concuerda el número', () => {
    expect(simulationsLabel(0)).toBe('0 simulaciones');
    expect(simulationsLabel(1)).toBe('1 simulación');
    expect(simulationsLabel(2)).toBe('2 simulaciones');
  });
});
