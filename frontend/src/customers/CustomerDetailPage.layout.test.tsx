// Composición del detalle (RF21, RF22, RF30): línea de contexto, orden del DOM y simulaciones guardadas en filas.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, waitForSimulator } from '../test/detail';
import { ACME, SIMULATION_USD } from '../test/fixtures';
import { formatDateOnly } from './format-since';

const context = () => screen.getByRole('region', { name: 'Datos del cliente' });
const follows = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe('Línea de contexto (RF21)', () => {
  it('muestra nombre, bandera con ISO y NIF, correo, plan, "Cliente desde" y el botón de presentación', async () => {
    renderDetail({ customer: ACME });
    await waitForSimulator();
    const view = within(context());
    expect(view.getByRole('heading', { level: 1, name: 'Acme Ibérica SL' })).toBeVisible();
    expect(view.getByText('ES')).toBeVisible();
    expect(view.getByText('B12345674')).toBeVisible();
    expect(view.getByText('compras@acme.es')).toBeVisible();
    expect(view.getByText('growth', { selector: '.badge' })).toBeVisible();
    expect(view.getByText(`Cliente desde ${formatDateOnly(ACME.createdAt)}`)).toBeVisible();
    expect(view.getByRole('button', { name: /Modo presentación/ })).toBeVisible();
  });

  it('el DOM de la cabecera es nombre, datos en una sola línea contenedora y botón (RF40)', async () => {
    renderDetail({ customer: ACME });
    await waitForSimulator();
    const [h1, meta, button] = Array.from(context().children);
    expect(h1?.tagName).toBe('H1');
    expect(meta).toHaveClass('customer-context__meta');
    expect(button).toHaveTextContent('Modo presentación');
    expect(within(meta as HTMLElement).getByText(ACME.email)).toBeVisible();
    expect(within(meta as HTMLElement).getByText(ACME.taxId)).toBeVisible();
    expect(within(meta as HTMLElement).getByText(ACME.plan)).toBeVisible();
    expect(within(meta as HTMLElement).getByText(/Cliente desde/)).toBeVisible();
  });

  it('la línea de contexto no repite el recuento de simulaciones (RF21)', async () => {
    renderDetail({ customer: ACME });
    await waitForSimulator();
    expect(within(context()).queryByText(/simulaciones/)).toBeNull();
  });
});

describe('Espacio de trabajo (RF22)', () => {
  it('el orden del DOM es contexto, configuración, presupuesto y simulaciones guardadas', async () => {
    renderDetail({ customer: ACME, simulations: [SIMULATION_USD] });
    await waitForSimulator();
    await screen.findByTestId('simulation-list');
    const config = screen.getByRole('heading', { name: '¿Cuántos usuarios?' });
    const sheet = screen.getByRole('region', { name: 'Presupuesto' });
    const saved = screen.getByRole('heading', { name: 'Simulaciones guardadas' });
    expect(follows(context(), config)).toBe(true);
    expect(follows(config, sheet)).toBe(true);
    expect(follows(sheet, saved)).toBe(true);
    expect(screen.getByRole('region', { name: 'Simulador' })).toHaveClass('workspace');
  });
});

describe('Simulaciones guardadas en filas (RF30, RF57)', () => {
  it('cada fila es expandible con un botón aria-expanded/aria-controls y muestra usuarios, total, fecha y divisa', async () => {
    const { user } = renderDetail({ customer: ACME, simulations: [SIMULATION_USD] });
    const list = await screen.findByTestId('simulation-list');
    const row = within(list).getAllByRole('row')[1] as HTMLElement;
    expect(row.querySelectorAll('.sim-row__cell')).toHaveLength(4);
    expect(within(row).getByText('USD')).toHaveClass('badge');
    const button = within(row).getByRole('button', { name: /^Desglose de la simulación del / });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const detail = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(detail).toHaveAttribute('hidden');
    expect(screen.queryByTestId('simulation-quote')).not.toBeVisible();
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('simulation-quote')).toBeVisible();
  });

  it('la tabla es semántica: cabeceras Usuarios, Total, Fecha y Divisa para lectores y botón accesible por teclado', async () => {
    const { user } = renderDetail({ customer: ACME, simulations: [SIMULATION_USD] });
    const list = await screen.findByTestId('simulation-list');
    expect(within(list).getAllByRole('columnheader').slice(0, 4).map((h) => h.textContent)).toEqual(['Usuarios', 'Total', 'Fecha', 'Divisa']);
    const button = within(list).getByRole('button', { name: /Desglose de la simulación/ });
    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
