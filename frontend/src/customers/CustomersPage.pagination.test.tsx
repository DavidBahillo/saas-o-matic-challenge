// RF1 a RF6, RF19 a RF22, RF25 a RF27: página en la URL, corrección de URL y borrado desde la lista.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Customer } from '@saas-o-matic/shared';
import { ACME, apiError, customerList, makeCustomer } from '../test/fixtures';
import type { MockHandler } from '../test/mock-fetch';
import { renderApp } from '../test/render';

const location = () => screen.getByTestId('location').textContent;
const make = (n: number): Customer[] => Array.from({ length: n }, (_, i) => makeCustomer({ id: 100 + i, companyName: `Empresa ${String(i + 1)}` }));

describe('CustomersPage: paginación en la URL', () => {
  it('page=1 se omite y no se envía; se respeta page al cargar', async () => {
    const { fetchMock } = renderApp({
      route: '/?page=2',
      routes: { 'GET /api/customers': (r) => customerList(make(1), 21, Number(r.query.get('page') ?? '1')) },
    });
    expect(await screen.findByText('Mostrando 21-21 de 21')).toBeVisible();
    expect(fetchMock.callsTo('GET /api/customers')[0]?.query.get('page')).toBe('2');
    expect(location()).toBe('/?page=2');
  });

  it('una página no canónica se envía como 1 y la URL se corrige con replace', async () => {
    const { fetchMock } = renderApp({
      route: '/?page=007',
      routes: { 'GET /api/customers': customerList(make(20), 40) },
    });
    await screen.findByText('Empresa 1');
    await waitFor(() => { expect(location()).toBe('/'); });
    expect(fetchMock.callsTo('GET /api/customers')[0]?.query.has('page')).toBe(false);
  });

  it('si el servidor devuelve otra página efectiva, la URL se corrige', async () => {
    renderApp({ route: '/?q=a&page=9', routes: { 'GET /api/customers': customerList(make(20), 40, 2) } });
    await screen.findByText('Empresa 1');
    await waitFor(() => { expect(location()).toBe('/?q=a&page=2'); });
  });

  it('pulsar una página cambia la URL y pide esa página', async () => {
    const { user, fetchMock } = renderApp({
      routes: { 'GET /api/customers': (r) => customerList(make(20), 60, Number(r.query.get('page') ?? '1')) },
    });
    await user.click(await screen.findByRole('link', { name: '3' }));
    expect(location()).toBe('/?page=3');
    await screen.findByText('Mostrando 41-60 de 60');
    expect(fetchMock.callsTo('GET /api/customers').at(-1)?.query.get('page')).toBe('3');
  });

  it('una búsqueda nueva reinicia la página', async () => {
    const { user } = renderApp({
      route: '/?page=3',
      routes: { 'GET /api/customers': (r) => customerList(make(20), 60, Number(r.query.get('page') ?? '1')) },
    });
    await screen.findByText('Mostrando 41-60 de 60');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar clientes' }), 'em');
    await waitFor(() => { expect(location()).toBe('/?q=em'); });
  });

  it('error con "Reintentar" sin perder q ni página', async () => {
    let calls = 0;
    const { user, fetchMock } = renderApp({
      route: '/?q=ac&page=2',
      routes: { 'GET /api/customers': () => (++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : customerList(make(1), 21, 2)) },
    });
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await screen.findByText('Empresa 1');
    const [first, second] = fetchMock.callsTo('GET /api/customers');
    expect([first?.query.get('q'), first?.query.get('page')]).toEqual(['ac', '2']);
    expect([second?.query.get('q'), second?.query.get('page')]).toEqual(['ac', '2']);
    expect(location()).toBe('/?q=ac&page=2');
  });
});

function deleteRoutes(listAfter: MockHandler, deleted: MockHandler): Record<string, MockHandler> {
  let done = false;
  return {
    'GET /api/customers': (r) => {
      const reply = done ? listAfter : customerList([ACME]);
      return typeof reply === 'function' ? reply(r) : reply;
    },
    'DELETE /api/customers/7': (r) => {
      done = true;
      return typeof deleted === 'function' ? deleted(r) : deleted;
    },
  };
}

async function confirmDelete(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Borrar Acme Ibérica SL' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  await user.click(within(dialog).getByRole('button', { name: 'Borrar' }));
}

describe('CustomersPage: aviso del estado de navegación', () => {
  it('se muestra una vez y se limpia del historial', async () => {
    renderApp({
      route: { pathname: '/', state: { notice: 'Cliente «X» actualizado.' } },
      routes: { 'GET /api/customers': customerList(make(2)) },
    });
    expect(await screen.findByText('Cliente «X» actualizado.')).toBeVisible();
    await waitFor(() => { expect(screen.getByTestId('location').dataset.state).toBe(''); });
    expect(screen.getByText('Cliente «X» actualizado.')).toBeVisible();
  });
});

describe('CustomersPage: borrar un cliente', () => {
  it('el aviso informa del deletedSimulations real y la lista muestra el vacío', async () => {
    const { user } = renderApp({
      routes: deleteRoutes(customerList([]), { body: { deletedSimulations: 3 } }),
    });
    await confirmDelete(user);
    expect(await screen.findByText('Cliente «Acme Ibérica SL» borrado junto con 3 simulaciones.')).toBeVisible();
    expect(await screen.findByText('Todavía no hay clientes.')).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sin simulaciones el aviso es corto y un 404 cuenta como éxito', async () => {
    const { user } = renderApp({
      routes: deleteRoutes(customerList([]), apiError(404, 'CUSTOMER_NOT_FOUND', 'No existe.')),
    });
    await confirmDelete(user);
    expect(await screen.findByText('El cliente «Acme Ibérica SL» ya no existía.')).toBeVisible();
  });

  it('borrar la última fila de la última página retrocede de página', async () => {
    let deleted = false;
    const { user } = renderApp({
      route: '/?page=2',
      routes: {
        'GET /api/customers': () => (deleted ? customerList(make(20), 20, 1) : customerList([ACME], 21, 2)),
        'DELETE /api/customers/7': () => {
          deleted = true;
          return { body: { deletedSimulations: 0 } };
        },
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Borrar Acme Ibérica SL' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar' }));
    await screen.findByText('Cliente «Acme Ibérica SL» borrado.');
    await waitFor(() => { expect(location()).toBe('/'); });
    expect(await screen.findByText('Empresa 1')).toBeVisible();
  });

  it('con búsqueda activa y sin más coincidencias muestra "Sin resultados"', async () => {
    const { user } = renderApp({
      route: '/?q=acme',
      routes: deleteRoutes(customerList([]), { body: { deletedSimulations: 0 } }),
    });
    await confirmDelete(user);
    expect(await screen.findByText('Sin resultados para «acme»')).toBeVisible();
  });

  it('un fallo deja el diálogo abierto con el error y "Reintentar"', async () => {
    const { user } = renderApp({
      routes: deleteRoutes(customerList([]), apiError(500, 'INTERNAL_ERROR', 'Fallo interno.')),
    });
    await confirmDelete(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo interno.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });

  it('cancelar no borra nada y devuelve el foco al botón de la fila', async () => {
    const { user, fetchMock } = renderApp({ routes: deleteRoutes(customerList([]), { body: { deletedSimulations: 0 } }) });
    const trigger = await screen.findByRole('button', { name: 'Borrar Acme Ibérica SL' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(fetchMock.callsTo('DELETE /api/customers/7')).toHaveLength(0);
  });
});
