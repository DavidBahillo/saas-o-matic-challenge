// Ronda 5 (RF64 a RF66): CSS de la lista de clientes y sus acciones, comprobado por texto.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const stripComments = (text: string): string => text.split('/*').map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2))).join('');
const css = (name: string): string => stripComments(readFileSync(join(import.meta.dirname, 'styles', name), 'utf8'));
const rules = (text: string): { selector: string; body: string }[] =>
  [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: (m[1] ?? '').trim(), body: m[2] ?? '' }));

describe('acciones de fila (RF64 a RF66)', () => {
  it('los botones llevan z-index mayor que el de los textos seleccionables y miden 44 px', () => {
    const icon = rules(css('components.css')).find((r) => r.selector === '.btn.btn--icon');
    expect(icon?.body).toMatch(/width:\s*44px/);
    const z = Number(/z-index:\s*(\d+)/.exec(icon?.body ?? '')?.[1]);
    expect(z).toBeGreaterThan(1);
    expect(rules(css('components.css')).find((r) => r.selector === '.btn.row-action--danger')?.body).toMatch(/--color-error-text/);
  });

  it('la columna tiene su anchura y, en apilado, los botones van en una línea al final', () => {
    const lists = css('lists.css');
    expect(lists).toMatch(/th:last-child \{ width: calc\(var\(--space-2xl\) \* 2 \+ var\(--space-xl\)\)/);
    expect(lists).toMatch(/\.row-actions \{[^}]*display:\s*flex/);
    expect(lists).toMatch(/\.customer-row > \.customer-row__actions \{[^}]*display:\s*flex;[^}]*justify-content:\s*flex-end/);
  });
});

describe('lista de clientes: reparto de columnas y acciones a la derecha (T13, correcciones)', () => {
  const lists = css('lists.css');

  it('bandera, ISO y NIF no se parten en escritorio y las columnas tienen anchuras repartidas', () => {
    expect(rules(lists).find((r) => r.selector === '.customer-row__country, .customer-row__taxid')?.body).toMatch(/white-space:\s*nowrap/);
    expect(lists).toMatch(/th:first-child \{ width: 24%/);
    expect(lists).toMatch(/th:nth-child\(2\) \{ width: 10%/);
    expect(lists).toMatch(/th:nth-child\(3\) \{ width: 14%/);
  });

  it('en apilado el selector de las acciones supera la especificidad de ".customer-row > td" (display: block)', () => {
    const mobile = lists.slice(lists.lastIndexOf('@media (max-width: 767px)'));
    expect(mobile).toMatch(/\.customer-row > \.customer-row__actions/);
    expect(mobile).toMatch(/\.customer-row > td \{/);
  });
});
