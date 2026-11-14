// Detalle del cliente (RF16 a RF18, RF38): tabla "Detalle y simulaciones guardadas" de la spec.
import type { Simulation } from '@saas-o-matic/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, setField, slider, usersField, ratesReady, waitForSimulator } from '../test/detail';
import { ACME, NEVER, SIMULATION_USD, apiError, customerList, makeCustomer } from '../test/fixtures';
import { renderApp } from '../test/render';

const sim = (over: Partial<Simulation>): Simulation => ({ ...SIMULATION_USD, ...over });
const location = () => screen.getByTestId('location').textContent;

describe('CustomerDetailPage: estados (CA5, RF17)', () => {
  it('muestra skeletons mientras carga', () => {
    renderApp({ route: '/customers/7', routes: { 'GET /api/customers/7': () => NEVER } });
    expect(screen.getByTestId('skeleton')).toBeVisible();
  });

  it('un fallo al cargar el cliente muestra el error con "Reintentar" que repite la petición', async () => {
    let calls = 0;
    const { user, fetchMock } = renderApp({
      route: '/customers/7',
      routes: {
        'GET /api/customers/7': () => (++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : { body: ACME }),
        'GET /api/customers/7/simulations': { body: { items: [] } },
      },
    });
    await screen.findByText('Fallo interno.');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme Ibérica SL' })).toBeVisible();
    expect(fetchMock.callsTo('GET /api/customers/7')).toHaveLength(2);
  });

  it('un fallo en la lista de simulaciones muestra error con "Reintentar" sin ocultar al cliente', async () => {
    let calls = 0;
    const { user } = renderDetail({
      routes: {
        'GET /api/customers/7/simulations': () =>
          ++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo en la lista.') : { body: { items: [SIMULATION_USD] } },
      },
    });
    await screen.findByText('Fallo en la lista.');
    expect(screen.getByRole('heading', { level: 1, name: 'Acme Ibérica SL' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByTestId('simulation-list')).toBeVisible();
  });

  it('mientras cargan las simulaciones hay skeletons', async () => {
    renderDetail({ routes: { 'GET /api/customers/7/simulations': () => NEVER } });
    await screen.findByRole('heading', { level: 1, name: 'Acme Ibérica SL' });
    expect(screen.getByTestId('skeleton')).toBeVisible();
  });

  it('sin simulaciones: vacío con "Crear la primera simulación" que lleva al simulador', async () => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Crear la primera simulación' }));
    expect(usersField()).toHaveFocus();
  });

  it.each([
    ['/customers/999', apiError(404, 'CUSTOMER_NOT_FOUND', 'No existe.')],
    ['/customers/abc', apiError(400, 'VALIDATION_ERROR', 'Id no válido.', { fields: [{ field: 'id', code: 'INVALID_ID', message: 'Id no válido.' }] })],
    ['/customers/0', apiError(400, 'VALIDATION_ERROR', 'Id no válido.', { fields: [{ field: 'id', code: 'INVALID_ID', message: 'Id no válido.' }] })],
  ])('%s muestra "Cliente no encontrado" con enlace a la lista', async (route, reply) => {
    const { user } = renderApp({
      route,
      routes: { [`GET /api${route}`]: reply, [`GET /api${route}/simulations`]: reply },
    });
    expect(await screen.findByText('Cliente no encontrado')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Volver a la lista' }));
    expect(location()).toBe('/');
  });
});

describe('CustomerDetailPage: datos y lista (RF16, RF18)', () => {
  it('/customers/7 muestra el cliente y su simulación más reciente primero', async () => {
    const sims = [
      sim({ id: 1, createdAt: '2026-11-12T09:00:00.000Z', users: 5 }),
      sim({ id: 3, createdAt: '2026-11-13T09:30:00.000Z', users: 30 }),
      sim({ id: 2, createdAt: '2026-11-13T09:30:00.000Z', users: 15 }),
    ];
    renderDetail({ simulations: sims });
    const list = await screen.findByTestId('simulation-list');
    const items = within(list).getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(items[0]).toContain('30 usuarios');
    expect(items[1]).toContain('15 usuarios');
    expect(items[2]).toContain('5 usuarios');
    expect(screen.getByText('compras@acme.es')).toBeVisible();
    expect(screen.getByText('B12345674')).toBeVisible();
  });

  it('cada fila muestra usuarios, divisa, total convertido y fecha local', async () => {
    renderDetail({ simulations: [SIMULATION_USD] });
    const item = within(await screen.findByTestId('simulation-list')).getAllByRole('row')[1] as HTMLElement;
    expect(item).toHaveTextContent(`15 usuarios`);
    expect(item).toHaveTextContent(`186,34 USD`);
    expect(item).toHaveTextContent('13 nov 2026, 09:30');
  });

  it('simulationCount 3 y 3 simulaciones en la lista coinciden en la pantalla', async () => {
    const sims = [1, 2, 3].map((id) => sim({ id }));
    renderDetail({ customer: makeCustomer({ simulationCount: 3 }), simulations: sims });
    expect(await screen.findByText('3 simulaciones')).toBeVisible();
    expect(within(await screen.findByTestId('simulation-list')).getAllByRole('row')).toHaveLength(4);
  });

  it('una simulación en USD con tipo 1,10 se muestra con 1,10 y sus importes guardados aunque el actual sea 1,20', async () => {
    const { user } = renderDetail({
      simulations: [SIMULATION_USD],
      routes: {
        'GET /api/exchange-rates': {
          body: { items: [{ currency: 'USD', exchangeRate: '1.200000', exchangeRateAt: '2026-11-13T09:00:00.000Z' }] },
        },
      },
    });
    await user.click(await screen.findByRole('button', { name: /Desglose de la simulación/ }));
    const quote = screen.getByTestId('simulation-quote');
    expect(within(quote).getByText('1,100000')).toBeVisible();
    expect(within(quote).getByText(`154,00 USD`)).toBeVisible();
    expect(within(quote).getByText(`32,34 USD`)).toBeVisible();
    expect(within(quote).getByText(`186,34 USD`)).toBeVisible();
    expect(within(quote).getByText(`169,40 EUR`, { selector: '[data-row="total"] td' })).toBeVisible();
  });

  it('una simulación migrada se muestra como EUR con tipo 1,000000', async () => {
    const migrated = sim({
      currency: 'EUR',
      exchangeRate: '1.000000',
      convertedBaseCents: 14000,
      convertedVatCents: 2940,
      convertedTotalCents: 16940,
    });
    const { user } = renderDetail({ simulations: [migrated] });
    await user.click(await screen.findByRole('button', { name: /Desglose de la simulación/ }));
    const quote = screen.getByTestId('simulation-quote');
    expect(within(quote).getByText('1,000000')).toBeVisible();
    expect(within(quote).getByText('EUR', { selector: 'dd' })).toBeVisible();
  });

  it('un presupuesto guardado no se ve afectado por la divisa activa', async () => {
    const { user } = renderDetail({ simulations: [SIMULATION_USD] });
    await waitForSimulator();
    await ratesReady();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Divisa' }), 'GBP');
    const item = within(await screen.findByTestId('simulation-list')).getAllByRole('row')[1] as HTMLElement;
    expect(item).toHaveTextContent('186,34 USD');
    expect(item).not.toHaveTextContent('GBP');
  });
});

describe('CustomerDetailPage: reinicio del simulador (RF38)', () => {
  it('al cambiar del cliente 7 al 9 el simulador vuelve a 10 usuarios, 0 y 0, y la divisa activa vuelve a la del país (EUR para PT, RF38 enmendado)', async () => {
    const nine = makeCustomer({ id: 9, companyName: 'Portuguesa SA', country: 'PT', simulationCount: 0 });
    const { user } = renderDetail({
      routes: {
        'GET /api/customers': customerList([nine]),
        'GET /api/customers/9': { body: nine },
        'GET /api/customers/9/simulations': { body: { items: [] } },
      },
    });
    await waitForSimulator();
    await ratesReady();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Divisa' }), 'USD');
    fireEvent.change(slider(), { target: { value: '30' } });
    setField('Almacenamiento (GB)', '5');
    setField('Llamadas a la API (al mes)', '7');
    await user.click(screen.getByRole('link', { name: 'Clientes' }));
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar clientes' }), 'port');
    await user.click(await screen.findByRole('link', { name: /^Portuguesa SA/ }));
    await waitFor(() => { expect(location()).toBe('/customers/9'); });
    await screen.findByRole('heading', { level: 1, name: 'Portuguesa SA' });
    await waitForSimulator();
    expect(usersField()).toHaveValue('10');
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveValue('0');
    expect(screen.getByLabelText('Llamadas a la API (al mes)')).toHaveValue('0');
    expect(screen.getByRole('combobox', { name: 'Divisa' })).toHaveValue('EUR');
  });
});
