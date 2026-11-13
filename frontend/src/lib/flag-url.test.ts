// RF18, RF21: URL de la bandera construida solo con un código ISO alfa-2 en mayúsculas.
import { describe, expect, it } from 'vitest';
import { FLAG_CDN_BASE, flagSources, isFlagCode } from './flag-url';

describe('flag-url', () => {
  it('la base es flagcdn.com', () => {
    expect(FLAG_CDN_BASE).toBe('https://flagcdn.com');
  });

  it('genera src w20 y srcset w40 2x en minúsculas', () => {
    expect(flagSources('ES')).toEqual({
      src: 'https://flagcdn.com/w20/es.png',
      srcSet: 'https://flagcdn.com/w40/es.png 2x',
    });
  });

  it.each(['ES', 'XK', 'GB'])('%s es un código válido', (code) => {
    expect(isFlagCode(code)).toBe(true);
  });

  it.each(['es', 'E1', '', 'ESP', 'E', ' E', 'E S'])('"%s" no es un código válido', (code) => {
    expect(isFlagCode(code)).toBe(false);
  });
});
