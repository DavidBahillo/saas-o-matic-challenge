// RF7, RF9, RF10, RF11: País y NIF en celdas propias, simulaciones solo con el número y chip de plan.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ACME, makeCustomer } from '../test/fixtures';
import { CustomerRow } from './CustomerRow';

function row(overrides: Parameters<typeof makeCustomer>[0] = {}): HTMLElement {
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <CustomerRow customer={makeCustomer(overrides)} onDelete={vi.fn()} />
        </tbody>
      </table>
    </MemoryRouter>,
  );
  return screen.getByRole('row');
}

describe('CustomerRow (spec 010)', () => {
  it.each([0, 1, 12])('la celda de simulaciones con %i solo contiene el número', (count) => {
    const cell = row({ simulationCount: count }).querySelector('.customer-row__sims');
    expect(cell?.textContent).toBe(String(count));
  });

  it.each([
    ['DNI', 'ES', '12345678Z'],
    ['NIE', 'ES', 'X1234567L'],
    ['CIF', 'ES', 'B12345674'],
    ['país sin NIF obligatorio', 'JP', 'JP-0001'],
  ])('NIF en su columna y país aparte (%s)', (_name, country, taxId) => {
    const tr = row({ country, taxId });
    const taxCell = tr.querySelector('.customer-row__taxid') as HTMLElement;
    const countryCell = tr.querySelector('.customer-row__country') as HTMLElement;
    expect(taxCell).toHaveTextContent(taxId);
    expect(taxCell.querySelector('.tabular')).not.toBeNull();
    expect(countryCell).not.toHaveTextContent(taxId);
    expect(within(countryCell).getByText(country)).toBeVisible();
  });

  it('el plan va en un chip de color por plan', () => {
    const chip = within(row({ plan: 'enterprise' })).getByText('enterprise');
    expect(chip).toHaveClass('badge', 'badge--plan-enterprise');
  });

  it('conserva el enlace de la empresa y las acciones', () => {
    const tr = row({});
    expect(within(tr).getByRole('link', { name: ACME.companyName })).toBeVisible();
    expect(within(tr).getByRole('button', { name: `Borrar ${ACME.companyName}` })).toBeVisible();
  });
});
