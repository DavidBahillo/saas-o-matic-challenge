// RF53: guardado bloqueado con aria-disabled, región de guardado y mensaje de cálculo imposible.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, saveButton, setField, ratesReady, waitForSimulator } from '../test/detail';
import { SIMULATION_USD, makeCustomer } from '../test/fixtures';

const POST = 'POST /api/simulations';

async function ready(options: Parameters<typeof renderDetail>[0] = {}) {
  const view = renderDetail(options);
  await waitForSimulator();
  await ratesReady();
  return view;
}

describe('Guardar bloqueado por validación (RF53)', () => {
  it('usa aria-disabled, conserva el foco, apunta a su explicación e ignora la pulsación', async () => {
    const { user, fetchMock } = await ready({ routes: { [POST]: { status: 201, body: SIMULATION_USD } } });
    setField('Usuarios', '-1');
    const button = saveButton();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleDescription(/Corrige los campos marcados/);
    expect(screen.queryByText(/^Corrige los campos marcados/, { selector: '.field__error' })).toBeNull();
    await user.click(button);
    expect(fetchMock.callsTo(POST)).toHaveLength(0);
    expect(button).toHaveFocus();
    expect(screen.getByText(/^Corrige los campos marcados/, { selector: '.field__error' })).toBeVisible();
  });

  it('sin bloqueo no lleva aria-disabled ni descripción', async () => {
    await ready();
    expect(saveButton()).not.toHaveAttribute('aria-disabled');
    expect(saveButton()).not.toHaveAttribute('aria-describedby');
  });

  it('la región de guardado anuncia solo "Presupuesto guardado" y la tabla queda fuera', async () => {
    const { user } = await ready({ routes: { [POST]: { status: 201, body: SIMULATION_USD } } });
    setField('Usuarios', '15');
    await user.click(saveButton());
    const table = await screen.findByTestId('saved-quote');
    const heading = screen.getByRole('heading', { name: 'Presupuesto guardado' });
    const region = heading.closest('[role="status"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.contains(table)).toBe(false);
  });
});

describe('Cálculo imposible (RF53)', () => {
  it('muestra el siguiente paso y un enlace para volver a la lista', async () => {
    renderDetail({ customer: makeCustomer({ country: 'ZZ' }) });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se puede calcular el precio de este cliente. Revisa su país o vuelve a la lista.');
    expect(within(alert).getByRole('link', { name: 'Volver a la lista' })).toHaveAttribute('href', '/');
  });
});
