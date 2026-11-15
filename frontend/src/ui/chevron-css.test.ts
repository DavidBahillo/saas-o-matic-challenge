// RF12, RF26: el chevron de los select usa la geometría de ui/icons en una máscara y ningún color literal.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colorViolations } from '../test/token-rules';
import { CHEVRON_PATH } from './icons';

const css = readFileSync(join(import.meta.dirname, '..', 'styles', 'components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const block = (selector: string): string => {
  const start = css.indexOf(selector);
  return start < 0 ? '' : css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
};
const after = block('.select-shell::after');
const uri = /url\("(data:image\/svg\+xml,[^"]+)"\)/.exec(after)?.[1] ?? '';

describe('chevron de los select (RF12)', () => {
  it('la máscara es una data-URI con CHEVRON_PATH y sin colores literales', () => {
    expect(uri).not.toBe('');
    expect(decodeURIComponent(uri)).toContain(`d='${CHEVRON_PATH}'`);
    expect(uri).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb|hsl/);
    expect(colorViolations(css)).toEqual([]);
  });

  it('pasa por -webkit-mask-image y mask-image, no recibe punteros y está a --space-md del borde', () => {
    expect(after).toMatch(/-webkit-mask-image:/);
    expect(after).toMatch(/(^|[\s;])mask-image:/);
    expect(after).toMatch(/pointer-events:\s*none/);
    expect(after).toMatch(/right:\s*var\(--space-md\)/);
    expect(after).toMatch(/background-color:\s*var\(--color-text-muted\)/);
  });

  it('cambia con hover, foco visible y deshabilitado, y sobrevive a forced-colors', () => {
    expect(css).toMatch(/\.select-shell:has\(select:hover\)::after\s*\{[^}]*var\(--color-text\)/);
    expect(css).toMatch(/\.select-shell:has\(select:focus-visible\)::after\s*\{[^}]*var\(--color-focus\)/);
    expect(css).toMatch(/\.select-shell:has\(select:disabled\)::after\s*\{[^}]*opacity:\s*0\.4/);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.select-shell::after\s*\{[^}]*forced-color-adjust:\s*none[^}]*ButtonText/);
  });

  it('el shell se ajusta al ancho del select para que el chevron quede dentro de su borde derecho (RF24)', () => {
    const shell = block('.select-shell {');
    expect(shell).toMatch(/position:\s*relative/);
    expect(shell).toMatch(/width:\s*fit-content/);
    expect(shell).not.toMatch(/(^|[\s;])width:\s*100%/);
    expect(block('.select-shell > select')).toMatch(/display:\s*block/);
  });

  it('el select ya no lleva el chevron de dos degradados', () => {
    expect(block('select.input')).not.toMatch(/gradient|background-position/);
  });
});
