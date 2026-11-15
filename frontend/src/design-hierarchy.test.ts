// Spec 010 RF1 y RF11: jerarquía de superficies del tema claro y tokens de plan distintos entre sí.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blendOver, contrastRatio, parseHex, parseTokenBlock } from './test/contrast';

const design = readFileSync(join(import.meta.dirname, '..', '..', 'DESIGN.md'), 'utf8');
const themes = parseTokenBlock(/```css\n([\s\S]*?)```/.exec(design)?.[1] ?? '');
const WHITE = parseHex('#FFFFFF');
const token = (theme: 'dark' | 'light', name: string): string => themes[theme][`--color-${name}`] ?? '';
/** Relación de luminancia con el blanco: más alta = más oscuro. */
const darkness = (theme: 'dark' | 'light', name: string): number =>
  contrastRatio(blendOver(parseHex(token(theme, name)), parseHex(token(theme, 'surface'))), WHITE);

describe('jerarquía de superficies en claro (RF1)', () => {
  it('el fondo es exactamente #E9E9E9 y la superficie #FFFFFF', () => {
    expect(token('light', 'bg').toUpperCase()).toBe('#E9E9E9');
    expect(token('light', 'surface').toUpperCase()).toBe('#FFFFFF');
  });

  it('fondo < superficie 2 < superficie en luminosidad', () => {
    expect(darkness('light', 'bg')).toBeGreaterThan(darkness('light', 'surface-2'));
    expect(darkness('light', 'surface-2')).toBeGreaterThan(darkness('light', 'surface'));
  });

  it.each(['hover', 'surface-2'])('%s es más oscuro que la superficie', (name) => {
    expect(darkness('light', name)).toBeGreaterThan(darkness('light', 'surface'));
  });
});

describe.each(['dark', 'light'] as const)('chips de plan en el tema %s (RF11b)', (theme) => {
  const distinct = (names: string[]): void => {
    const values = names.map((n) => token(theme, n).toUpperCase());
    expect(values.every((v) => v !== '')).toBe(true);
    expect(new Set(values).size).toBe(names.length);
  };

  it('los tres fondos son distintos entre sí', () => {
    distinct(['plan-starter-bg', 'plan-growth-bg', 'plan-enterprise-bg']);
  });

  it('los tres textos (info-text, plan-growth-text, text) son distintos entre sí', () => {
    distinct(['info-text', 'plan-growth-text', 'text']);
  });
});
