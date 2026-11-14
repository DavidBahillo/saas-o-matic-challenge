// RF61, RF62, RF63: los estilos de las listas no alcanzan a la tabla del desglose anidada.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIMULATION_USD } from '../test/fixtures';
import { SimulationList } from './SimulationList';

const lists = readFileSync(join(import.meta.dirname, '..', 'styles', 'lists.css'), 'utf8')
  .split('/*')
  .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
  .join('');
const FAMILIES = ['.sim-table', '.sim-detail', '.sim-row', '.simulation-list', '.customer-list', '.customer-row'];
const selectors = [...lists.matchAll(/([^{}@]+)\{[^{}]*\}/g)]
  .flatMap((m) => (m[1] ?? '').split(','))
  .map((s) => s.trim())
  .filter((s) => FAMILIES.some((f) => s.startsWith(f)));

/** Quita los pseudoestados y pseudoelementos para poder usar Element.matches. */
const plain = (selector: string): string => selector.replace(/::?[a-z-]+(\([^)]*\))?/g, '');

function openList() {
  render(<SimulationList items={[SIMULATION_USD]} />);
  fireEvent.click(screen.getByRole('button', { name: /Desglose de la simulación/ }));
  const detail = screen.getByTestId('simulation-quote');
  return { detail, region: within(detail).getByRole('region'), table: within(detail).getByRole('table') };
}

describe('aislamiento de estilos de las listas (RF62)', () => {
  it('hay selectores de las listas que comprobar', () => {
    expect(selectors.length).toBeGreaterThan(20);
  });

  it('ningún selector de las listas coincide con la tabla del desglose anidada ni con su región', () => {
    const { region, table } = openList();
    const nested = [region, table, ...Array.from(table.querySelectorAll('thead, tbody, tr, th, td'))];
    for (const selector of selectors) {
      for (const element of nested) {
        expect(element.matches(plain(selector)), `${selector} coincide con <${element.tagName.toLowerCase()}>`).toBe(false);
      }
    }
  });

  it('ningún selector de esas familias usa un descendiente genérico de thead, tbody, tr, th o td', () => {
    const generic = /^\S+\s+(thead|tbody|tr|th|td)\b/;
    expect(selectors.filter((s) => generic.test(s))).toEqual([]);
  });
});

describe('desglose abierto (RF61, RF63)', () => {
  it('es la misma tabla que la de la hoja: región, thead, tbody y 4 columnas por fila de tramo', () => {
    const { region, table } = openList();
    expect(region).toHaveClass('quote-table-wrap');
    expect(table).toHaveClass('quote-table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Concepto', 'Unidades', 'Precio', 'Subtotal']);
    for (const row of table.querySelectorAll('tbody tr[data-row="tier"]')) expect(row.children).toHaveLength(4);
  });

  it('el desglose y su región ocupan la fila sin tarjeta (CSS)', () => {
    expect(lists).toMatch(/\.sim-detail > td \{[^}]*display: block/);
    expect(lists).toMatch(/\.saved-quote \{[^}]*min-width: 0/);
    expect(lists).not.toMatch(/\.sim-detail[^{]*\{[^}]*border:/);
  });
});
