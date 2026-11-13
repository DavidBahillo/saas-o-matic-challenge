// Alta de cliente (RF10 a RF15): formulario y éxito.
import { ISO_3166_ALPHA2, PLANS } from '@saas-o-matic/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACME, NEVER, customerList, makeCustomer } from '../test/fixtures';
import { control, field, fillValid, renderForm, submit, validation } from '../test/new-customer';
import { renderApp } from '../test/render';

describe('NewCustomerPage: formulario (RF10, RF11)', () => {
  it('muestra los cinco controles, con países y planes de shared/', () => {
    renderForm();
    expect(within(control('País')).getAllByRole('option')).toHaveLength(ISO_3166_ALPHA2.length + 1);
    const plans = within(control('Plan')).getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(plans).toEqual([...PLANS]);
    expect(control('Empresa')).toBeVisible();
    expect(control('Identificador fiscal')).toBeVisible();
    expect(control('Email')).toBeVisible();
  });

  it('envía los valores tal cual, sin normalizar', async () => {
    const { user, fetchMock } = renderForm({ 'POST /api/customers': { status: 201, body: ACME } });
    await fillValid(user);
    await user.click(submit());
    await waitFor(() => { expect(fetchMock.callsTo('POST /api/customers')).toHaveLength(1); });
    expect(fetchMock.callsTo('POST /api/customers')[0]?.body).toEqual({
      companyName: 'Acme Ibérica SL',
      country: 'ES',
      taxId: 'b-12.345.674',
      email: 'compras@acme.es',
      plan: 'growth',
    });
  });

  it('formulario vacío: cuatro campos de texto como "" y cada error en su control con el foco en el primero', async () => {
    const { user, fetchMock } = renderForm({
      'POST /api/customers': validation(
        field('companyName', 'REQUIRED', 'La empresa es obligatoria.'),
        field('country', 'REQUIRED', 'El país es obligatorio.'),
        field('taxId', 'REQUIRED', 'El identificador fiscal es obligatorio.'),
        field('email', 'REQUIRED', 'El email es obligatorio.'),
        field('plan', 'INVALID_PLAN', 'El plan no es válido.'),
      ),
    });
    await user.click(submit());
    expect(fetchMock.callsTo('POST /api/customers')[0]?.body).toEqual({
      companyName: '',
      country: '',
      taxId: '',
      email: '',
      plan: 'starter',
    });
    expect(await screen.findByText('La empresa es obligatoria.')).toBeVisible();
    expect(control('Empresa')).toHaveAccessibleDescription('La empresa es obligatoria.');
    expect(control('País')).toHaveAccessibleDescription('El país es obligatorio.');
    expect(control('Identificador fiscal')).toHaveAccessibleDescription('El identificador fiscal es obligatorio.');
    expect(control('Email')).toHaveAccessibleDescription('El email es obligatorio.');
    expect(control('Plan')).toHaveAccessibleDescription('El plan no es válido.');
    expect(control('Empresa')).toHaveFocus();
  });

  it('el foco va al primer control con error aunque no sea el primero del formulario', async () => {
    const { user } = renderForm({ 'POST /api/customers': validation(field('email', 'INVALID_EMAIL', 'Email no válido.')) });
    await user.click(submit());
    await screen.findByText('Email no válido.');
    expect(control('Email')).toHaveFocus();
  });

  it('durante el envío el botón queda deshabilitado', async () => {
    const { user } = renderForm({ 'POST /api/customers': () => NEVER });
    await user.click(submit());
    expect(await screen.findByRole('button', { name: 'Creando…' })).toBeDisabled();
  });

  it('doble clic en "Crear cliente": una sola petición', async () => {
    const { user, fetchMock } = renderForm({ 'POST /api/customers': () => NEVER });
    await user.dblClick(submit());
    expect(fetchMock.callsTo('POST /api/customers')).toHaveLength(1);
  });
});

describe('NewCustomerPage: éxito (RF15)', () => {
  it('el 201 navega a /customers/:id y la lista muestra el cliente sin recargar', async () => {
    const created = makeCustomer({ id: 12, companyName: 'Nueva SL', simulationCount: 0 });
    let posted = false;
    const { user } = renderApp({
      route: '/',
      routes: {
        'GET /api/customers': () => customerList(posted ? [created] : []),
        'POST /api/customers': () => {
          posted = true;
          return { status: 201, body: created };
        },
        'GET /api/customers/12': { body: created },
        'GET /api/customers/12/simulations': { body: { items: [] } },
      },
    });
    await user.click(await screen.findByRole('link', { name: 'Dar de alta un cliente' }));
    await fillValid(user);
    await user.click(submit());
    await waitFor(() => { expect(screen.getByTestId('location')).toHaveTextContent('/customers/12'); });
    await user.click(screen.getByRole('link', { name: 'SaaS-O-Matic' }));
    expect(await screen.findByText('Nueva SL')).toBeVisible();
    expect(screen.getByText('0 simulaciones')).toBeVisible();
  });
});
