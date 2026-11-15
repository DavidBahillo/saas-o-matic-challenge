// RF18, RF19, RF28: toda `transition` de las hojas de estilo vive dentro de prefers-reduced-motion: no-preference.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = join(import.meta.dirname, 'styles');
const read = (name: string): string => readFileSync(join(dir, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
const MARKER = '@media (prefers-reduced-motion: no-preference)';

/** Quita los bloques `@media (prefers-reduced-motion: no-preference) { ... }` (con llaves anidadas). */
function withoutNoPreference(css: string): string {
  let out = css;
  for (let at = out.indexOf(MARKER); at !== -1; at = out.indexOf(MARKER)) {
    let depth = 0;
    let end = out.indexOf('{', at);
    for (; end < out.length; end += 1) {
      if (out[end] === '{') depth += 1;
      if (out[end] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out = out.slice(0, at) + out.slice(end + 1);
  }
  return out;
}

/** El contenido de los bloques no-preference. */
const insideNoPreference = (css: string): string => css.slice(css.indexOf(MARKER));

describe('movimiento (RF28)', () => {
  it('ninguna transición queda fuera de prefers-reduced-motion: no-preference', () => {
    for (const file of files) {
      const outside = withoutNoPreference(read(file));
      const offenders = outside.split('\n').filter((l) => /\btransition\s*:/.test(l) && !/transition:\s*none/.test(l));
      expect(offenders, `${file} tiene transiciones fuera del bloque no-preference`).toEqual([]);
    }
  });

  it('el despliegue y la barra de tramos declaran sus transiciones dentro del bloque no-preference', () => {
    const lists = insideNoPreference(read('lists.css'));
    const sim = insideNoPreference(read('simulator.css'));
    expect(lists).toMatch(/grid-template-rows 250ms ease/);
    expect(lists).toMatch(/\.sim-row__chevron[^}]*transform 250ms ease/);
    expect(sim).toMatch(/\.stack__item[^}]*flex-grow 250ms ease/);
  });

  it('el detalle se anima de 0fr a 1fr sobre un contenedor interior y el plegado queda oculto a lectores', () => {
    const lists = read('lists.css');
    expect(lists).toMatch(/\.sim-detail > td \{[^}]*display: grid[^}]*grid-template-rows: 0fr/);
    expect(lists).toMatch(/\.sim-detail\[data-open="true"\] > td \{[^}]*grid-template-rows: 1fr/);
    expect(lists).toMatch(/\.sim-detail__panel \{[^}]*overflow: hidden[^}]*min-height: 0[^}]*visibility: hidden/);
    expect(lists).toMatch(/\.sim-detail\[data-open="true"\] \.sim-detail__panel \{[^}]*visibility: visible/);
  });

  it('el bloque global de movimiento reducido se mantiene como red de seguridad', () => {
    expect(read('base.css')).toMatch(/prefers-reduced-motion: reduce[\s\S]*transition: none !important/);
  });
});
