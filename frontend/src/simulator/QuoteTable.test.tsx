// RF44, RF42, RF52: filas de resumen en "Concepto" con una celda vacía de colSpan 2; región con nombre único y foco solo si desborda.
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SavedQuote } from '../customers/SavedQuote';
import { SIMULATION_USD } from '../test/fixtures';
import { QuoteTable } from './QuoteTable';

const quote = {
  tiers: [
    { tier: 1 as const, from: 1, to: 10, billedUsers: 10, unitPriceCents: 1000, subtotalCents: 10000 },
    { tier: 2 as const, from: 11, to: 50, billedUsers: 0, unitPriceCents: 800, subtotalCents: 0 },
    { tier: 3 as const, from: 51, to: null, billedUsers: 0, unitPriceCents: 500, subtotalCents: 0 },
  ],
  baseCents: 10000,
  vatRatePercent: 21,
  vatCents: 2100,
  totalCents: 12100,
};

afterEach(() => { vi.restoreAllMocks(); });

function expectSummaryRows(table: HTMLElement): void {
  const rows = Array.from(table.querySelectorAll<HTMLElement>('tbody tr'));
  expect(rows.map((r) => r.dataset.row)).toEqual(['tier', 'tier', 'tier', 'base', 'vat', 'total']);
  for (const row of rows.slice(3)) {
    const cells = Array.from(row.children);
    expect(cells.map((c) => c.tagName)).toEqual(['TH', 'TD', 'TD']);
    expect(cells[0]).toHaveAttribute('scope', 'row');
    expect(cells[1]).toHaveAttribute('colspan', '2');
    expect(cells[1]).toBeEmptyDOMElement();
    expect(cells[2]?.textContent).toMatch(/\d/);
  }
  expect(table.querySelectorAll('[colspan]:not([colspan="2"])')).toHaveLength(0);
}

describe('QuoteTable: filas de resumen', () => {
  it('hoja: etiqueta en Concepto, celda vacía de colSpan 2 e importe en Subtotal', () => {
    const { container } = render(<QuoteTable quote={quote} label="Desglose por tramos" />);
    expectSummaryRows(container);
    const labels = Array.from(container.querySelectorAll('[data-row="base"] th, [data-row="vat"] th, [data-row="total"] th')).map((t) => t.textContent);
    expect(labels.map((l) => l.replace(new RegExp(String.fromCharCode(0xa0), 'g'), ' '))).toEqual(['Base', 'IVA (21 %)', 'Total']);
  });

  it('simulación guardada: mismo componente, mismas filas', () => {
    const { container } = render(<SavedQuote simulation={SIMULATION_USD} testId="q" />);
    expectSummaryRows(within(container).getByRole('table'));
  });
});

describe('QuoteTable: región con desplazamiento (RF52)', () => {
  it('lleva el nombre recibido y no es enfocable si no desborda', () => {
    render(<QuoteTable quote={quote} label="Desglose por tramos" />);
    const region = screen.getByRole('region', { name: 'Desglose por tramos' });
    expect(region).not.toHaveAttribute('tabindex');
  });

  it('es enfocable solo con desbordamiento real', () => {
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500);
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300);
    render(<QuoteTable quote={quote} label="Desglose por tramos" />);
    expect(screen.getByRole('region', { name: 'Desglose por tramos' })).toHaveAttribute('tabindex', '0');
  });

  it('la hoja y la simulación guardada tienen nombres distintos', () => {
    render(
      <>
        <QuoteTable quote={quote} label="Desglose por tramos" />
        <SavedQuote simulation={SIMULATION_USD} testId="q" />
      </>,
    );
    const names = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    expect(new Set(names).size).toBe(2);
    expect(names[1]).toMatch(/^Desglose de la simulación del /);
  });

  it('observa el contenedor y también la tabla', () => {
    const observed: Element[] = [];
    class Spy {
      constructor(private readonly cb: () => void) {}
      observe(el: Element): void { observed.push(el); this.cb(); }
      disconnect(): void { /* sin efecto */ }
    }
    vi.stubGlobal('ResizeObserver', Spy);
    render(<QuoteTable quote={quote} label="Desglose por tramos" />);
    expect(observed.map((e) => e.tagName)).toEqual(['DIV', 'TABLE']);
    vi.unstubAllGlobals();
  });
});
