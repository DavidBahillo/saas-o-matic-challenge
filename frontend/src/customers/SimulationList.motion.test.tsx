// RF18: el detalle de cada simulación se anima con grid-template-rows; el estado inert/aria sigue siempre coherente.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SIMULATION_USD } from '../test/fixtures';
import { SimulationList } from './SimulationList';

const toggle = () => screen.getByRole('button', { name: /Desglose de la simulación/ });
const detail = () => document.getElementById(toggle().getAttribute('aria-controls') ?? '') as HTMLElement;
const panel = () => detail().querySelector('.sim-detail__panel') as HTMLElement;

describe('SimulationList: despliegue animado (RF18)', () => {
  it('el detalle siempre existe: cerrado tiene data-open false y el panel inerte, sin atributo hidden', () => {
    render(<SimulationList items={[SIMULATION_USD]} />);
    expect(detail()).not.toHaveAttribute('hidden');
    expect(detail()).toHaveAttribute('data-open', 'false');
    expect(panel()).toHaveAttribute('inert');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('al abrir, data-open es true, el panel deja de ser inerte y aria-expanded lo refleja', () => {
    render(<SimulationList items={[SIMULATION_USD]} />);
    fireEvent.click(toggle());
    expect(detail()).toHaveAttribute('data-open', 'true');
    expect(panel()).not.toHaveAttribute('inert');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('alternar varias veces seguidas (a mitad de la transición) deja siempre estado y aria coherentes', () => {
    render(<SimulationList items={[SIMULATION_USD]} />);
    for (const open of [true, false, true, false, true]) {
      fireEvent.click(toggle());
      expect(detail()).toHaveAttribute('data-open', String(open));
      expect(toggle()).toHaveAttribute('aria-expanded', String(open));
      expect(panel().hasAttribute('inert')).toBe(!open);
    }
  });

  it('el desglose está dentro del panel y el botón conserva el foco al alternar', () => {
    render(<SimulationList items={[SIMULATION_USD]} />);
    toggle().focus();
    fireEvent.click(toggle());
    expect(panel()).toContainElement(screen.getByTestId('simulation-quote'));
    expect(toggle()).toHaveFocus();
  });

  it('el chevron es el mismo icono en ambos estados (se gira por CSS, no se intercambia)', () => {
    render(<SimulationList items={[SIMULATION_USD]} />);
    const icon = toggle().querySelector('svg');
    fireEvent.click(toggle());
    expect(toggle().querySelector('svg')).toBe(icon);
  });
});
