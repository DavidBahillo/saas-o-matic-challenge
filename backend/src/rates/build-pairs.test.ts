// buildPairs (RF3, RF5): tolerancia por divisa sobre el texto crudo del proveedor.
import { CURRENCIES } from '@saas-o-matic/shared';
import { describe, expect, it } from 'vitest';
import { buildPairs } from './build-pairs';

describe('buildPairs', () => {
  it.each([
    ['1.1', 1_100_000],
    ['0.951234567', 951_235],
    ['0.951234499', 951_234],
    ['100.0000004', 100_000_000],
    ['0.0099996', 10_000],
    ['0.01', 10_000],
    ['100', 100_000_000],
  ])('USD = %s da %i micro-unidades', (text, micros) => {
    expect(buildPairs({ USD: text }).get('USD')).toBe(micros);
  });

  it.each([['1e1'], ['11e0'], ['-1'], ['+1'], ['abc'], [''], ['0'], ['0.0099994'], ['100.0000005'], ['NaN'], ['1,5']])(
    'SEK = %j queda no disponible y el resto sigue',
    (text) => {
      const pairs = buildPairs({ SEK: text, CHF: '0.95' });
      expect(pairs.has('SEK')).toBe(false);
      expect(pairs.get('CHF')).toBe(950_000);
    },
  );

  it('una divisa ausente no está en el resultado', () => {
    expect([...buildPairs({ USD: '1.1', CHF: '0.95' }).keys()]).toEqual(['USD', 'CHF']);
  });

  it('respeta el orden de la lista aunque la entrada vaya desordenada', () => {
    const pairs = buildPairs({ AED: '4', CHF: '0.95', USD: '1.1' });
    expect([...pairs.keys()]).toEqual(['USD', 'CHF', 'AED']);
  });

  it('ignora claves que no son de la lista (JPY, EUR)', () => {
    const raw = { JPY: '170', EUR: '1', USD: '1.1' } as unknown as Parameters<typeof buildPairs>[0];
    expect([...buildPairs(raw).keys()]).toEqual(['USD']);
  });

  it('sin entradas da un mapa vacío y con todas las de la lista da 22', () => {
    expect(buildPairs({}).size).toBe(0);
    const all = Object.fromEntries(CURRENCIES.filter((c) => c !== 'EUR').map((c) => [c, '1.5']));
    expect(buildPairs(all).size).toBe(22);
  });
});
