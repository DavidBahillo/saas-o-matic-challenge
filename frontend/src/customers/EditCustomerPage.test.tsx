// RF7 a RF12, RF14, RF16, RF18, RF30: edición con el formulario del alta y datos precargados del servidor.
import { PLANS } from '@saas-o-matic/shared';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACME, NEVER, apiError, customerList, deferred, makeCustomer } from '../test/fixtures';
import { control, field, validation } from '../test/new-customer';
import { renderApp } from '../test/render';
import type { RenderAppOptions } from '../test/render';

const location = () => screen.getByTestId('location').textContent;
const save = () => screen.getByRole('button', { name: 'Guardar cambios' });
const SAVED = makeCustomer({ companyName: 'Acme Iberia SL', plan: 'enterprise' });

function setup(options: RenderAppOptions = {}) {
  return renderApp({ route: '/customers/7/edit', ...options, routes: { 'GET /api/customers/7': { body: ACME }, ...options.routes } });
}

describe('EditCustomerPage: datos precargados (RF7, RF8, RF9)', () => {
  it('por URL directa muestra los cinco campos ya rellenos con los datos del servidor', async () => {
    const { fetchMock } = setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Editar cliente' })).toBeVisible();
    expect(control('Empresa')).toHaveValue('Acme Ibérica SL');
    expect(control('País')).toHaveValue('ES');
    expect(control('Identificador fiscal')).toHaveValue('B12345674');
    expect(control('Email')).toHaveValue('compras@acme.es');
    expect(control('Plan')).toHaveValue('growth');
    expect(fetchMock.callsTo('GET /api/customers/7')).toHaveLength(1);
    expect(PLANS[0]).not.toBe('growth');
    expect(document.title).toBe('Editar cliente · SaaS-O-Matic');
  });

  it('usa los mismos controles que el alta (grupos y etiquetas)', async () => {
    setup();
    await screen.findByLabelText('Empresa');
    expect(screen.getByRole('group', { name: 'Empresa' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Contacto y plan' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Crear cliente' })).toBeNull();
  });

  it('mientras carga muestra un esqueleto y no el formulario', () => {
    setup({ routes: { 'GET /api/customers/7': () => NEVER } });
    expect(screen.getByTestId('skeleton')).toBeVisible();
    expect(screen.queryByLabelText('Empresa')).toBeNull();
  });

  it('404 muestra "Cliente no encontrado" con enlace a la lista', async () => {
    setup({ routes: { 'GET /api/customers/7': apiError(404, 'CUSTOMER_NOT_FOUND', 'No existe.') } });
    expect(await screen.findByRole('heading', { name: 'Cliente no encontrado' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Volver a la lista' })).toHaveAttribute('href', '/');
  });

  it('un id no válido (INVALID_ID) también es "no encontrado"', async () => {
    renderApp({
      route: '/customers/abc/edit',
      routes: { 'GET /api/customers/abc': apiError(400, 'VALIDATION_ERROR', 'Id no válido.', { fields: [field('id', 'INVALID_ID', 'Id no válido.')] }) },
    });
    expect(await screen.findByRole('heading', { name: 'Cliente no encontrado' })).toBeVisible();
  });

  it('un fallo ofrece "Reintentar", que carga los datos', async () => {
    let calls = 0;
    const { user } = setup({
      routes: { 'GET /api/customers/7': () => (++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : { body: ACME }) },
    });
    await screen.findByText('Fallo interno.');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByLabelText('Empresa')).toHaveValue('Acme Ibérica SL');
  });

  it('al montar siempre pide el cliente al servidor aunque haya una copia en caché', async () => {
    const { user, fetchMock } = renderApp({
      routes: { 'GET /api/customers': customerList([ACME]), 'GET /api/customers/7': { body: ACME } },
    });
    await user.click(await screen.findByRole('link', { name: 'Editar Acme Ibérica SL' }));
    await screen.findByLabelText('Empresa');
    expect(fetchMock.callsTo('GET /api/customers/7')).toHaveLength(1);
  });
});

describe('EditCustomerPage: guardar (RF10 a RF12, RF14, RF16, RF18)', () => {
  it('guarda con PUT, invalida lista y detalle y vuelve a "/" con aviso por defecto', async () => {
    const { user, fetchMock } = setup({
      routes: { 'PUT /api/customers/7': { body: SAVED }, 'GET /api/customers': customerList([SAVED]) },
    });
    await screen.findByLabelText('Empresa');
    await user.clear(control('Empresa'));
    await user.type(control('Empresa'), 'Acme Iberia SL');
    await user.selectOptions(control('Plan'), 'enterprise');
    await user.click(save());
    await waitFor(() => { expect(location()).toBe('/'); });
    expect(fetchMock.callsTo('PUT /api/customers/7')[0]?.body).toEqual({
      companyName: 'Acme Iberia SL',
      country: 'ES',
      taxId: 'B12345674',
      email: 'compras@acme.es',
      plan: 'enterprise',
    });
    expect(await screen.findByText('Cliente «Acme Iberia SL» actualizado.')).toBeVisible();
  });

  it('vuelve a la búsqueda y página de origen (state.from)', async () => {
    const { user } = renderApp({
      route: '/?q=acme&page=2',
      routes: {
        'GET /api/customers': (r) => customerList([ACME], 21, Number(r.query.get('page') ?? '1')),
        'GET /api/customers/7': { body: ACME },
        'PUT /api/customers/7': { body: SAVED },
      },
    });
    await user.click(await screen.findByRole('link', { name: 'Editar Acme Ibérica SL' }));
    await screen.findByLabelText('Empresa');
    await user.click(save());
    await waitFor(() => { expect(location()).toBe('/?q=acme&page=2'); });
    expect(await screen.findByText('Cliente «Acme Iberia SL» actualizado.')).toBeVisible();
  });

  it('el enlace "Cancelar" vuelve al origen sin guardar', async () => {
    const { user, fetchMock } = setup();
    await screen.findByLabelText('Empresa');
    await user.click(screen.getByRole('link', { name: 'Cancelar' }));
    expect(location()).toBe('/');
    expect(fetchMock.callsTo('PUT /api/customers/7')).toHaveLength(0);
  });

  it('errores por campo junto a su control, incluido UNKNOWN_FIELD', async () => {
    const { user } = setup({
      routes: {
        'PUT /api/customers/7': validation(
          field('email', 'INVALID_EMAIL', 'Email no válido.'),
          field('id', 'UNKNOWN_FIELD', 'Campo desconocido: id.'),
        ),
      },
    });
    await screen.findByLabelText('Empresa');
    await user.click(save());
    expect(await screen.findByText('Email no válido.')).toBeVisible();
    expect(control('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Campo desconocido: id.')).toBeVisible();
    expect(control('Email')).toHaveFocus();
  });

  it('409 muestra el mensaje y "Ver el cliente existente"', async () => {
    const { user } = setup({
      routes: { 'PUT /api/customers/7': apiError(409, 'CUSTOMER_ALREADY_EXISTS', 'Ya existe un cliente con ese NIF.', { existingId: 3 }) },
    });
    await screen.findByLabelText('Empresa');
    await user.click(save());
    expect(await screen.findByText('Ya existe un cliente con ese NIF.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver el cliente existente' })).toHaveAttribute('href', '/customers/3');
    expect(location()).toBe('/customers/7/edit');
  });

  it('impide el doble envío mientras se guarda', async () => {
    const gate = deferred<{ body: unknown }>();
    const { user, fetchMock } = setup({ routes: { 'PUT /api/customers/7': () => gate.promise } });
    await screen.findByLabelText('Empresa');
    await user.dblClick(save());
    expect(fetchMock.callsTo('PUT /api/customers/7')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
    gate.resolve({ body: SAVED });
  });

  it('un refetch posterior no pisa lo que el usuario está escribiendo', async () => {
    const { user, fetchMock } = setup();
    await screen.findByLabelText('Empresa');
    await user.clear(control('Empresa'));
    await user.type(control('Empresa'), 'Nuevo nombre');
    window.dispatchEvent(new Event('focus'));
    expect(control('Empresa')).toHaveValue('Nuevo nombre');
    expect(fetchMock.callsTo('GET /api/customers/7')).toHaveLength(1);
  });
});
