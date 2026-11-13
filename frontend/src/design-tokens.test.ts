// CA6, RF31, RF36: tokens de DESIGN.md, sin colores a mano y sin divisas fuera de EUR, USD y GBP.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = import.meta.dirname;
const DESIGN = join(import.meta.dirname, '..', '..', 'DESIGN.md');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

const normalize = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

describe('tokens de diseño', () => {
  it('no hay colores escritos a mano en frontend/src fuera de tokens.css', () => {
    const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
    const offenders = sourceFiles(SRC)
      .filter((file) => /\.(css|tsx?)$/.test(file))
      .filter((file) => !/\.test\.tsx?$/.test(file) && !file.endsWith('tokens.css'))
      .filter((file) => literal.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('tokens.css coincide con el bloque CSS de DESIGN.md', () => {
    const design = readFileSync(DESIGN, 'utf8');
    const block = /```css\n([\s\S]*?)```/.exec(design)?.[1];
    expect(block).toBeDefined();
    const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8');
    expect(normalize(tokens)).toBe(normalize(block ?? ''));
  });

  it('DESIGN.md solo lista EUR, USD y GBP: no contiene CHF ni JPY (RF36)', () => {
    expect(readFileSync(DESIGN, 'utf8')).not.toMatch(/\b(CHF|JPY)\b/);
  });
});
