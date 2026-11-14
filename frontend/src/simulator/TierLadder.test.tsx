// Escalera de cuadrados (RF43, RF24): lista accesible, sin estilos de tamaño, abreviaturas por ancho medido.
import { calculateQuote } from '@saas-o-matic/shared';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLadder } from './ladder-model';
import { TierLadder } from './TierLadder';

const steps = (users: number) => {
  const result = calculateQuote({ users, country: 'ES' });
  if (!result.ok) throw new Error('cálculo no válido');
  return buildLadder(result.value.tiers);
};
const flat = (text: string | null | undefined): string => (text ?? '').replaceAll(String.fromCharCode(0xa0), ' ');
const list = () => screen.getByRole('list', { name: 'Precio por usuario según tramo' });

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function measure(width: number) {
  class FakeObserver {
    constructor(private readonly cb: () => void) {}
    observe(): void { this.cb(); }
    disconnect(): void { /* sin efecto */ }
  }
  vi.stubGlobal('ResizeObserver', FakeObserver);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width);
}

describe('TierLadder', () => {
  it('tres elementos sin estilos de ancho ni alto, sin leyenda y con el nombre accesible', () => {
    const { container } = render(<TierLadder steps={steps(23)} presentation={false} />);
    const items = within(list()).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    for (const li of items) expect(li.getAttribute('style') ?? '').not.toMatch(/width|height/);
    expect(screen.queryByTestId('ladder-legend')).toBeNull();
    expect(container.querySelector('.ladder__legend, .ladder__swatch')).toBeNull();
  });

  it('con el lado por defecto (96 px) todo el texto va completo', () => {
    render(<TierLadder steps={steps(51)} presentation={false} />);
    const [first, , third] = within(list()).getAllByRole('listitem');
    expect(first?.querySelector('[aria-hidden="true"]')?.textContent).toMatch(/^10,00.EUR1–10$/);
    expect(flat(third?.querySelector('[aria-hidden="true"]')?.textContent)).toMatch(/51 o más$/);
  });

  it('en presentación con 104 px el precio se abrevia, el rango no, y el texto completo queda para lectores', () => {
    measure(104);
    render(<TierLadder steps={steps(51)} presentation />);
    const [first] = within(list()).getAllByRole('listitem');
    expect(first?.querySelector('[aria-hidden="true"]')).toHaveTextContent('10 €');
    expect(first?.querySelector('.sr-only')?.textContent).toMatch(/Tramo 1: 10,00.EUR por usuario al mes, de 1 a 10 usuarios/);
    expect(first?.querySelector('[aria-hidden="true"]')?.textContent).toMatch(/1–10$/);
  });

  it('el rango "51 o más" se abrevia a "51+" cuando no cabe', () => {
    measure(70);
    render(<TierLadder steps={steps(51)} presentation={false} />);
    const [, , third] = within(list()).getAllByRole('listitem');
    expect(third?.querySelector('[aria-hidden="true"]')?.textContent).toContain('51+');
  });

  it('el tramo no alcanzado lleva " (no alcanzado)" para lectores y la clase atenuada', () => {
    render(<TierLadder steps={steps(1)} presentation={false} />);
    const [first, second] = within(list()).getAllByRole('listitem');
    expect(first?.textContent).not.toMatch(/no alcanzado/);
    expect(second?.textContent).toMatch(/\(no alcanzado\)/);
    expect(second).toHaveClass('ladder__step--dim');
  });

  it('a 104 px en presentación se abrevian los tres precios a la vez; el rango, por separado', () => {
    measure(104);
    render(<TierLadder steps={steps(51)} presentation />);
    const visible = within(list()).getAllByRole('listitem').map((li) => flat(li.querySelector('[aria-hidden="true"]')?.textContent));
    expect(visible).toEqual(['10 €1–10', '8 €11–50', '5 €51 o más']);
  });

  it('a 96 px en modo normal los tres precios van completos', () => {
    measure(96);
    render(<TierLadder steps={steps(51)} presentation={false} />);
    const prices = within(list()).getAllByRole('listitem').map((li) => li.querySelector('b')?.textContent ?? '');
    expect(prices.map((p) => p.replace(new RegExp(String.fromCharCode(0xa0), 'g'), ' '))).toEqual(['10,00 EUR', '8,00 EUR', '5,00 EUR']);
  });

  it('en presentación el ancho por defecto es 120 px: sin medida, los precios caben completos', () => {
    render(<TierLadder steps={steps(51)} presentation />);
    const prices = within(list()).getAllByRole('listitem').map((li) => flat(li.querySelector('b')?.textContent));
    expect(prices).toEqual(['10,00 EUR', '8,00 EUR', '5,00 EUR']);
  });
});
