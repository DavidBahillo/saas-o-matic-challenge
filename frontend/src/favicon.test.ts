// RF60: favicon SVG enlazado desde index.html con los colores de --color-action y --color-sage de DESIGN.md.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTokenBlock } from './test/contrast';

const root = join(import.meta.dirname, '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const design = readFileSync(join(root, '..', 'DESIGN.md'), 'utf8');
const themes = parseTokenBlock(/```css\n([\s\S]*?)```/.exec(design)?.[1] ?? '');

describe('favicon (RF60)', () => {
  it('index.html enlaza el SVG y no lleva colores literales', () => {
    expect(html).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it('todos sus colores son --color-action o --color-sage de DESIGN.md (en uno de los dos temas)', () => {
    const allowed = new Set(
      [themes.dark['--color-action'], themes.dark['--color-sage'], themes.light['--color-action'], themes.light['--color-sage']].map((c) => c?.toUpperCase()),
    );
    const colors = (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((c) => c.toUpperCase());
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(allowed.has(color)).toBe(true);
  });

  it('usa los dos tokens en el tema claro y en el oscuro (prefers-color-scheme)', () => {
    expect(svg).toContain(themes.light['--color-action']?.toUpperCase());
    expect(svg).toContain(themes.light['--color-sage']?.toUpperCase());
    expect(svg).toContain(themes.dark['--color-action']?.toUpperCase());
    expect(svg).toContain(themes.dark['--color-sage']?.toUpperCase());
    expect(svg).toMatch(/prefers-color-scheme:\s*dark/);
  });
});
