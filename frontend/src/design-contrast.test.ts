// RF31: contraste WCAG de la lista cerrada de pares, en ambos temas, leyendo el bloque de DESIGN.md.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blendOver, contrastRatio, parseHex, parseTokenBlock } from './test/contrast';
import { PAIRS } from './test/contrast-pairs';

const design = readFileSync(join(import.meta.dirname, '..', '..', 'DESIGN.md'), 'utf8');
const block = /```css\n([\s\S]*?)```/.exec(design)?.[1] ?? '';
const themes = parseTokenBlock(block);

describe('ayudas de contraste', () => {
  it('negro sobre blanco es 21:1 y el alfa se mezcla sobre el fondo', () => {
    expect(contrastRatio(parseHex('#000'), parseHex('#FFFFFF'))).toBeCloseTo(21, 5);
    expect(parseHex('#FFFFFF80').a).toBeCloseTo(0.5, 1);
    const mixed = blendOver(parseHex('#00000080'), parseHex('#FFFFFF'));
    expect(Math.round(mixed.r)).toBe(127);
  });
});

describe.each(['dark', 'light'] as const)('contraste en el tema %s', (name) => {
  const tokens = themes[name];
  const surface = (): ReturnType<typeof parseHex> => parseHex(tokens['--color-surface'] ?? '');
  const color = (token: string): ReturnType<typeof parseHex> => {
    const value = tokens[`--color-${token}`];
    if (value === undefined) throw new Error(`falta --color-${token}`);
    return blendOver(parseHex(value), surface());
  };

  it.each(PAIRS)('$fg sobre $bg llega a $min', ({ fg, bg, min }) => {
    const base = color(bg);
    const ratio = contrastRatio(blendOver(color(fg), base), base);
    expect(ratio, `${fg} sobre ${bg}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});
