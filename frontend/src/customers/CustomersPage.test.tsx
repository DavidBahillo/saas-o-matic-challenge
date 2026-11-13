// Lista y búsqueda (RF4 a RF9): filas de "Lista y búsqueda" de la spec.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACME, NEVER, apiError, customerList, makeCustomer } from '../test/fixtures';
import { renderApp } from '../test/render';

const ZERO = makeCustomer({ id: 8, companyName: 'Cero SA', simulationCount: 0, plan: 'starter', country: 'PT' });
const ONE = makeCustomer({ id: 9, companyName: 'Uno SL', simulationCount: 1, plan: 'enterprise' });
const location = () => screen.getByTestId('location').textContent;
const searchBox = () => screen.getByRole('searchbox', { name: 'Buscar clientes' });

describe('CustomersPage: estados (CA5)', () => {
  it('muestra skeletons mientras carga', () => {
    renderApp({ routes: { 'GET /api/customers': () => NEVER } });
    expect(screen.getByTestId('skeleton')).toBeVisible();
  });

  it('error con "Reintentar" que repite la petición', async () => {
    let calls = 0;
    const { user, fetchMock } = renderApp({
      routes: {
        'GET /api/customers': () =>
          ++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : customerList([ACME]),
      },
    });
    await screen.findByText('Fallo interno.');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Acme Ibérica SL')).toBeVisible();
    expect(fetchMock.callsTo('GET /api/customers')).toHaveLength(2);
  });

  it('un cuerpo inesperado muestra el error general, sin JSON', async () => {
    renderApp({ routes: { 'GET /api/customers': { body: { foo: 1 } } } });
    expect(await screen.findByText(/Algo ha salido mal/)).toBeVisible();
  });

  it('base sin clientes: vacío con "Dar de alta un cliente"', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([]) } });
    const link = await screen.findByRole('link', { name: 'Dar de alta un cliente' });
    expect(link).toHaveAttribute('href', '/customers/new');
  });
});

describe('CustomersPage: tarjetas (RF4, RF9)', () => {
  it('cada tarjeta muestra empresa, NIF con badge de país, email, plan y simulaciones', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    const card = await screen.findByRole('link', { name: /Acme Ibérica SL/ });
    const scope = within(card);
    expect(scope.getByText('Acme Ibérica SL')).toBeVisible();
    expect(scope.getByText('B12345674')).toBeVisible();
    expect(scope.getByText('ES')).toHaveClass('badge');
    expect(scope.getByText('compras@acme.es')).toBeVisible();
    expect(scope.getByText('growth')).toBeVisible();
    expect(scope.getByText('2 simulaciones')).toBeVisible();
  });

  it('clientes con 0, 1 y 2 simulaciones usan el texto correcto y conservan el orden recibido', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ZERO, ONE, ACME]) } });
    await screen.findByText('Cero SA');
    expect(screen.getByText('0 simulaciones')).toBeVisible();
    expect(screen.getByText('1 simulación')).toBeVisible();
    expect(screen.getByText('2 simulaciones')).toBeVisible();
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(['Cero SA', 'Uno SL', 'Acme Ibérica SL']);
  });

  it('activar una tarjeta con el ratón va a /customers/:id', async () => {
    const { user } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    await user.click(await screen.findByRole('link', { name: /Acme Ibérica SL/ }));
    expect(location()).toBe('/customers/7');
  });

  it('activar una tarjeta con el teclado va a /customers/:id', async () => {
    const { user } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    const card = await screen.findByRole('link', { name: /Acme Ibérica SL/ });
    card.focus();
    await user.keyboard('{Enter}');
    expect(location()).toBe('/customers/7');
  });

  it('con más de 50 coincidencias indica "Mostrando 50 de TOTAL"', async () => {
    const items = Array.from({ length: 50 }, (_, i) =>
      makeCustomer({ id: i + 1, companyName: `Empresa ${String(i + 1)}` }),
    );
    renderApp({ routes: { 'GET /api/customers': customerList(items, 73) } });
    expect(await screen.findByText('Mostrando 50 de 73')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(50);
  });

  it('sin exceso no muestra "Mostrando"', async () => {
    renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    await screen.findByText('Acme Ibérica SL');
    expect(screen.queryByText(/Mostrando/)).toBeNull();
  });
});

describe('CustomersPage: búsqueda (RF6)', () => {
  it('q=acme encuentra "Acme Ibérica SL" y recargar /?q=acme conserva la búsqueda', async () => {
    const { fetchMock } = renderApp({
      route: '/?q=acme',
      routes: { 'GET /api/customers': (r) => customerList(r.query.get('q') === 'acme' ? [ACME] : []) },
    });
    expect(await screen.findByText('Acme Ibérica SL')).toBeVisible();
    expect(searchBox()).toHaveValue('acme');
    expect(fetchMock.callsTo('GET /api/customers')[0]?.query.get('q')).toBe('acme');
  });

  it('q=iberica sin resultados: "Sin resultados para «iberica»" con opción de borrar', async () => {
    const { user } = renderApp({
      route: '/?q=iberica',
      routes: { 'GET /api/customers': (r) => customerList(r.query.has('q') ? [] : [ACME]) },
    });
    expect(await screen.findByText('Sin resultados para «iberica»')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    expect(location()).toBe('/');
    expect(await screen.findByText('Acme Ibérica SL')).toBeVisible();
  });

  it('con solo espacios se pide y se ve la lista completa', async () => {
    const { fetchMock } = renderApp({ route: '/?q=%20%20', routes: { 'GET /api/customers': customerList([ACME]) } });
    expect(await screen.findByText('Acme Ibérica SL')).toBeVisible();
    expect(fetchMock.callsTo('GET /api/customers')[0]?.query.has('q')).toBe(false);
  });

  it('q=% se envía codificado y se muestra literal', async () => {
    const { fetchMock } = renderApp({ route: '/?q=%25', routes: { 'GET /api/customers': customerList([]) } });
    await screen.findByText('Sin resultados para «%»');
    expect(fetchMock.callsTo('GET /api/customers')[0]?.query.get('q')).toBe('%');
  });

  it('escribir "a", "ac" y "acm" en menos de 300 ms hace una sola petición con q=acm', async () => {
    const { user, fetchMock } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    await screen.findByText('Acme Ibérica SL');
    await user.type(searchBox(), 'acm');
    await waitFor(() => { expect(location()).toBe('/?q=acm'); });
    await screen.findByText('Acme Ibérica SL');
    const queries = fetchMock.callsTo('GET /api/customers').map((c) => c.query.get('q'));
    expect(queries).toEqual([null, 'acm']);
  });

  it('una respuesta tardía de una búsqueda anterior no sustituye a la última', async () => {
    let releaseA: (() => void) | undefined;
    const lateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    const { user, fetchMock } = renderApp({
      routes: {
        'GET /api/customers': async (r) => {
          const q = r.query.get('q');
          if (q === 'a') {
            await lateA;
            return customerList([ZERO]);
          }
          return customerList(q === 'ab' ? [ONE] : [ACME]);
        },
      },
    });
    await screen.findByText('Acme Ibérica SL');
    await user.type(searchBox(), 'a');
    await waitFor(() => { expect(fetchMock.callsTo('GET /api/customers')).toHaveLength(2); });
    await user.type(searchBox(), 'b');
    expect(await screen.findByText('Uno SL')).toBeVisible();
    releaseA?.();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByText('Uno SL')).toBeVisible();
    expect(screen.queryByText('Cero SA')).toBeNull();
  });
});
