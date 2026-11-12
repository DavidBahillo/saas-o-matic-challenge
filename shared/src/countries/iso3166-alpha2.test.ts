import { describe, expect, it } from 'vitest';
import { ISO_3166_ALPHA2, isIsoAlpha2 } from './iso3166-alpha2';

describe('ISO_3166_ALPHA2 (RF6)', () => {
  it('tiene los 249 códigos oficialmente asignados', () => {
    expect(ISO_3166_ALPHA2).toHaveLength(249);
  });

  it('no tiene duplicados', () => {
    expect(new Set(ISO_3166_ALPHA2).size).toBe(ISO_3166_ALPHA2.length);
  });

  it('todos son dos letras A–Z en orden alfabético', () => {
    for (const code of ISO_3166_ALPHA2) expect(code).toMatch(/^[A-Z]{2}$/);
    expect([...ISO_3166_ALPHA2].sort()).toEqual(ISO_3166_ALPHA2);
  });

  it.each(['ES', 'GB', 'PT', 'FR', 'DE', 'IT', 'US', 'SS', 'BQ', 'CW', 'SX', 'AX', 'ZW'])(
    'incluye %s',
    (code) => {
      expect(isIsoAlpha2(code)).toBe(true);
    },
  );

  it.each(['UK', 'EU', 'EL', 'XK', 'AN', 'XX', 'es', 'ESP', 'E', ''])('no incluye %j', (code) => {
    expect(isIsoAlpha2(code)).toBe(false);
  });
});
