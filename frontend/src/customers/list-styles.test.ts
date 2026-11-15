// RF6, RF8, RF10: botones de fila y paginación con fondo y borde de control, hueco de 16 px y sin colores literales.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colorViolations } from '../test/token-rules';

const read = (name: string): string =>
  readFileSync(join(import.meta.dirname, '..', 'styles', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const lists = read('lists.css');
const pagination = read('pagination.css');
const rule = (css: string, selector: string): string => {
  const start = css.indexOf(`${selector} {`);
  return start < 0 ? '' : css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
};

describe('estilos de la lista de clientes (spec 010)', () => {
  it('los botones de fila tienen fondo --color-bg, borde de control y hover secundario', () => {
    const base = rule(lists, '.row-actions .btn');
    expect(base).toContain('background: var(--color-bg)');
    expect(base).toContain('border: 1px solid var(--color-border-control)');
    expect(rule(lists, '.row-actions .btn:hover')).toContain('var(--color-secondary-hover)');
  });

  it('la paginación no activa tiene superficie, borde de control, hover --color-hover y hueco --space-md', () => {
    const link = rule(pagination, '.pagination__link');
    expect(link).toContain('background: var(--color-surface)');
    expect(link).toContain('1px solid var(--color-border-control)');
    expect(rule(pagination, '.pagination__link:hover')).toContain('background: var(--color-hover)');
    expect(rule(pagination, '.pagination__list')).toContain('gap: var(--space-md)');
    expect(rule(pagination, '.pagination__link[aria-current="page"]')).toContain('var(--color-action)');
  });

  it('sin colores literales y con lists.css por debajo de 200 líneas', () => {
    expect(colorViolations(lists)).toEqual([]);
    expect(colorViolations(pagination)).toEqual([]);
    const lines = readFileSync(join(import.meta.dirname, '..', 'styles', 'lists.css'), 'utf8').split('\n').length;
    expect(lines).toBeLessThan(200);
  });

  it('la celda de simulaciones apilada no lleva etiqueta y País y NIF sí', () => {
    expect(lists).not.toMatch(/customer-row__sims::before/);
    expect(lists).toMatch(/\.customer-row__taxid/);
  });
});

describe('estilos del formulario (RF22)', () => {
  it('la tarjeta se centra solo en horizontal con 560 px y no quedan reglas de grupos', () => {
    expect(rule(lists, '.form-card')).toContain('max-width: 560px');
    expect(rule(lists, '.form-card')).toContain('width: 100%');
    expect(rule(lists, '.form-page')).not.toMatch(/min-height|justify-content: center/);
    expect(lists).not.toMatch(/form__group|legend/);
  });
});
