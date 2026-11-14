// Barra de tramos (RF41, RF50, RF14): sin importes ni leyenda; texto en tres niveles; estructura estable; botón solo si abrevia.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { QuoteChart } from './QuoteChart';

const NB = String.fromCharCode(0xa0);
const nb = (text: string): string => text.replaceAll(' ', NB);

// 10 usuarios en ES: a 480 px, "Tramo 1" e "IVA 21 %" caben enteros.
const quote = {
  tiers: [{ tier: 1 as const, from: 1, to: 10, billedUsers: 10, unitPriceCents: 1000, subtotalCents: 10000 }],
  baseCents: 10000,
  vatRatePercent: 21,
  vatCents: 2100,
  totalCents: 12100,
};
// El tramo 3 es el 1 % de la barra.
const three = {
  tiers: [
    { tier: 1 as const, from: 1, to: 10, billedUsers: 10, unitPriceCents: 1000, subtotalCents: 10000 },
    { tier: 2 as const, from: 11, to: 50, billedUsers: 40, unitPriceCents: 800, subtotalCents: 32000 },
    { tier: 3 as const, from: 51, to: null, billedUsers: 1, unitPriceCents: 500, subtotalCents: 500 },
  ],
  baseCents: 42500,
  vatRatePercent: 21,
  vatCents: 8925,
  totalCents: 51425,
};
const re = (text: string): RegExp => new RegExp(text.replaceAll(' ', '.'));
const bar = () => screen.getByTestId('stack-bar');
const bubble = () => bar().querySelector('.tooltip__bubble');

class FakeObserver {
  constructor(private readonly cb: () => void) {}
  observe(): void { this.cb(); }
  disconnect(): void { /* sin efecto */ }
}
function measure(width: number): void {
  vi.stubGlobal('ResizeObserver', FakeObserver);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width);
}

describe('QuoteChart', () => {
  beforeEach(useFakeClock);
  afterEach(() => { vi.restoreAllMocks(); useRealClock(); });

  it('sin leyenda, subtítulo ni importes: solo nombres dentro de los segmentos', () => {
    const { container } = render(<QuoteChart quote={quote} />);
    expect(container.querySelector('[data-testid="stack-outside"], .stack__outside, .stack__swatch, .chart__subtitle')).toBeNull();
    expect(container.querySelectorAll('[title]')).toHaveLength(0);
    expect(bar()).toHaveTextContent('Tramo 1');
    expect(bar()).toHaveTextContent('IVA 21 %');
    expect(bar().textContent).toContain(nb('IVA 21 %'));
    expect(bar().textContent).not.toMatch(/EUR|\d,\d\d/);
  });

  it('los segmentos con el nombre completo son un div sin foco ni botón', () => {
    render(<QuoteChart quote={quote} />);
    expect(within(bar()).queryAllByRole('button')).toHaveLength(0);
    expect(bar().querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('segmento sin texto: <button type="button"> con su nombre una sola vez; el tooltip sale al enfocar y Escape lo cierra', () => {
    render(<QuoteChart quote={three} />);
    const seg = within(bar()).getByRole('button', { name: nb('Tramo 3') });
    expect(seg).toHaveAttribute('type', 'button');
    expect(seg.textContent).toBe(nb('Tramo 3'));
    act(() => { seg.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    expect(bubble()).toHaveTextContent(re('Tramo 3'));
    expect(bubble()).toHaveAttribute('aria-hidden', 'true');
    expect(seg).not.toHaveAttribute('aria-describedby');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(bubble()).toBeNull();
  });

  it('el tooltip también sale con el ratón a los 150 ms', () => {
    render(<QuoteChart quote={three} />);
    const seg = within(bar()).getByRole('button', { name: nb('Tramo 3') });
    fireEvent.mouseEnter(seg.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(150));
    expect(bubble()).toHaveTextContent(re('Tramo 3'));
  });

  it('un segmento completo no muestra tooltip aunque se pase el ratón', () => {
    render(<QuoteChart quote={quote} />);
    const item = bar().firstElementChild as HTMLElement;
    fireEvent.mouseEnter(item);
    act(() => void vi.advanceTimersByTime(200));
    expect(bubble()).toBeNull();
  });

  it('el encabezado es solo para lectores (h4) y no hay subtítulo', () => {
    render(<QuoteChart quote={quote} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Desglose del coste mensual' })).toHaveClass('sr-only');
    expect(screen.queryByText(/sale del tramo/)).toBeNull();
  });

  it('con 0 usuarios no hay segmentos', () => {
    const empty = { tiers: [], baseCents: 0, vatRatePercent: 21, vatCents: 0, totalCents: 0 };
    render(<QuoteChart quote={empty} />);
    expect(bar().children).toHaveLength(0);
  });

  it('en una barra de 300 px el IVA va abreviado ("21 %") dentro de un botón con el nombre completo', () => {
    measure(300);
    render(<QuoteChart quote={quote} />);
    const vat = within(bar()).getByRole('button', { name: nb('IVA 21 %') });
    expect(vat).toHaveTextContent(re('21 %'));
  });

  it('al pasar de abreviado ("T3") a sin texto, el botón es el mismo nodo y conserva el foco', () => {
    const short = { ...three, tiers: three.tiers.map((t) => (t.tier === 3 ? { ...t, subtotalCents: 4000 } : t)), baseCents: 46000, vatCents: 9660, totalCents: 55660 };
    const { rerender } = render(<QuoteChart quote={short} />);
    const seg = within(bar()).getByRole('button', { name: nb('Tramo 3') });
    expect(seg).toHaveTextContent('T3');
    act(() => { seg.focus(); });
    rerender(<QuoteChart quote={three} />);
    const after = within(bar()).getByRole('button', { name: nb('Tramo 3') });
    expect(after.textContent).toBe(nb('Tramo 3'));
    expect(after).toBe(seg);
    expect(after).toHaveFocus();
  });

  it('pulsar o tocar un segmento abreviado alterna el tooltip y expone aria-expanded', () => {
    render(<QuoteChart quote={three} />);
    const seg = within(bar()).getByRole('button', { name: nb('Tramo 3') });
    expect(seg).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(seg);
    expect(seg).toHaveAttribute('aria-expanded', 'true');
    expect(bubble()).toHaveTextContent(re('Tramo 3'));
    fireEvent.click(seg);
    expect(bubble()).toBeNull();
  });
});
