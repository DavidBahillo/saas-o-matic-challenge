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
  const value = (token: string): string => {
    const v = tokens[`--color-${token}`];
    if (v === undefined) throw new Error(`falta --color-${token}`);
    return v;
  };
  /** Color de un token mezclado sobre la superficie (`surface`) o el fondo de página (`bg`). */
  const mixOver = (token: string, over: 'surface' | 'bg'): ReturnType<typeof parseHex> =>
    blendOver(parseHex(value(token)), parseHex(value(over)));
  const applicable = PAIRS.filter((p) => p.themes === undefined || p.themes.includes(name));

  it.each(applicable)('$fg sobre $bg (sobre $over) llega a $min', ({ fg, bg, min, over = 'surface' }) => {
    const base = mixOver(bg, over);
    const ratio = contrastRatio(blendOver(mixOver(fg, over), base), base);
    expect(ratio, `${fg} sobre ${bg}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});
