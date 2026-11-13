// RF14 a RF17: divisa del país por visita (tabla "Divisa por país y preselección" de la spec 007).
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, saveButton, setField, waitForSimulator } from '../test/detail';
import { ACME, RATES_UNAVAILABLE, SIMULATION_USD, customerList, deferred, makeCustomer, ratesBody } from '../test/fixtures';
import type { MockOutcome } from '../test/mock-fetch';
import { renderApp } from '../test/render';

const US = makeCustomer({ id: 8, companyName: 'Acme Inc', taxId: '123456789', country: 'US' });
const RATES = 'GET /api/exchange-rates';
const select = () => screen.getByRole('combobox', { name: 'Divisa' });
const pick = (user: ReturnType<typeof renderApp>['user'], value: string) => user.selectOptions(select(), value);

describe('Preselección de la divisa del país (RF14)', () => {
  it('cliente US con todo cargado: USD, y mientras tanto carga sin simulador', async () => {
    const rates = deferred<MockOutcome>();
    renderDetail({ customer: US, routes: { [RATES]: () => rates.promise } });
    await screen.findByTestId('skeleton');
    expect(screen.queryByRole('button', { name: 'Guardar simulación' })).toBeNull();
    rates.resolve({ body: ratesBody() });
    await waitForSimulator();
    expect(select()).toHaveValue('USD');
    expect(screen.getByTestId('converted-preview')).toBeVisible();
  });

  it('cliente cargado antes que los tipos: espera y aplica al resolverse los tipos', async () => {
    const rates = deferred<MockOutcome>();
    renderDetail({ customer: US, routes: { [RATES]: () => rates.promise } });
    await screen.findByTestId('skeleton');
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByTestId('skeleton')).toBeVisible();
    rates.resolve({ body: ratesBody() });
    await waitForSimulator();
    expect(select()).toHaveValue('USD');
  });

  it('tipos cargados antes que el cliente: aplica al cargar el cliente', async () => {
    const customer = deferred<MockOutcome>();
    renderDetail({ customer: US, routes: { 'GET /api/customers/8': () => customer.promise } });
    await screen.findByText(/Tipos actualizados/);
    expect(select()).toHaveValue('EUR');
    customer.resolve({ body: US });
    await waitForSimulator();
    expect(select()).toHaveValue('USD');
  });

  it('país XX: EUR', async () => {
    renderDetail({ customer: makeCustomer({ id: 9, country: 'XX' }) });
    await screen.findByText(/Tipos actualizados/);
    await waitFor(() => { expect(select()).toHaveValue('EUR'); });
  });

  it('país sin divisa propia en la lista (JP): EUR', async () => {
    renderDetail({ customer: makeCustomer({ id: 9, country: 'JP' }) });
    await waitForSimulator();
    expect(select()).toHaveValue('EUR');
  });

  it('país con divisa sin tipo en el snapshot: EUR', async () => {
    renderDetail({ customer: makeCustomer({ id: 9, country: 'CH' }), routes: { [RATES]: { body: ratesBody(['USD']) } } });
    await waitForSimulator();
    expect(select()).toHaveValue('EUR');
  });
});

describe('Tipos que fallan y "Reintentar" (RF15)', () => {
  function withRetry() {
    let attempts = 0;
    return renderDetail({
      customer: US,
      routes: { [RATES]: () => (++attempts === 1 ? RATES_UNAVAILABLE : { body: ratesBody() }) },
    });
  }

  it('sin elección manual aplica la divisa del país al recuperarse', async () => {
    const { user } = withRetry();
    await waitForSimulator();
    expect(select()).toHaveValue('EUR');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(select()).toHaveValue('USD'); });
  });

  it('con elección manual la conserva', async () => {
    const { user } = withRetry();
    await waitForSimulator();
    await pick(user, 'EUR');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText(/Tipos actualizados/);
    expect(select()).toHaveValue('EUR');
  });
});

describe('Elección manual (RF15)', () => {
  it('elegida antes de resolverse los tipos: se conserva', async () => {
    const rates = deferred<MockOutcome>();
    const { user } = renderDetail({ customer: US, routes: { [RATES]: () => rates.promise } });
    await screen.findByTestId('skeleton');
    await pick(user, 'EUR');
    rates.resolve({ body: ratesBody() });
    await waitForSimulator();
    expect(select()).toHaveValue('EUR');
  });

  it('elegida después de la preselección: se conserva', async () => {
    const { user } = renderDetail({ customer: US });
    await waitForSimulator();
    await pick(user, 'GBP');
    expect(select()).toHaveValue('GBP');
  });
});

describe('Visitas (RF15)', () => {
  it('A (US) -> B (ES) -> A: EUR en B y USD al volver a A aunque eligiera otra a mano', async () => {
    const { user } = renderApp({
      routes: {
        'GET /api/customers': customerList([US, ACME]),
        'GET /api/customers/8': { body: US },
        'GET /api/customers/8/simulations': { body: { items: [] } },
        'GET /api/customers/7': { body: ACME },
        'GET /api/customers/7/simulations': { body: { items: [] } },
      },
    });
    await user.click(await screen.findByRole('link', { name: /Acme Inc/ }));
    await waitForSimulator();
    expect(select()).toHaveValue('USD');
    await pick(user, 'GBP');
    await user.click(screen.getByRole('link', { name: 'SaaS-O-Matic' }));
    await user.click(await screen.findByRole('link', { name: /Acme Ibérica/ }));
    await waitForSimulator();
    expect(select()).toHaveValue('EUR');
    await user.click(screen.getByRole('link', { name: 'SaaS-O-Matic' }));
    await user.click(await screen.findByRole('link', { name: /Acme Inc/ }));
    await waitForSimulator();
    expect(select()).toHaveValue('USD');
  });

  it('cliente 404: no cambia la divisa activa', async () => {
    const { user } = renderApp({
      routes: {
        'GET /api/customers': customerList([ACME]),
        'GET /api/customers/7': { status: 404, body: { error: { code: 'CUSTOMER_NOT_FOUND', message: 'No existe.' } } },
      },
    });
    await screen.findByText(/Acme Ibérica/);
    await screen.findByText(/Tipos actualizados/);
    await pick(user, 'USD');
    await user.click(screen.getByRole('link', { name: /Acme Ibérica/ }));
    await screen.findByRole('heading', { name: 'Cliente no encontrado' });
    expect(select()).toHaveValue('USD');
  });
});

describe('Guardar y mostrar (RF16, RF17)', () => {
  it('guarda con la divisa activa al pulsar aunque cambie durante la petición', async () => {
    const post = deferred<MockOutcome>();
    const { user, fetchMock } = renderDetail({ routes: { 'POST /api/simulations': () => post.promise } });
    await waitForSimulator();
    await screen.findByText(/Tipos actualizados/);
    setField('Usuarios', '15');
    await pick(user, 'USD');
    await user.click(saveButton());
    await pick(user, 'GBP');
    post.resolve({ status: 201, body: SIMULATION_USD });
    const saved = await screen.findByTestId('saved-quote');
    expect(fetchMock.callsTo('POST /api/simulations')[0]?.body).toMatchObject({ currency: 'USD' });
    expect(within(saved).getAllByText('USD').length).toBeGreaterThan(0);
    expect(select()).toHaveValue('GBP');
  });

  it('una simulación en JPY se muestra con sus datos congelados', async () => {
    const jpy = { ...SIMULATION_USD, currency: 'JPY', convertedTotalCents: 2_500_000 };
    renderDetail({ simulations: [jpy as never] });
    expect((await screen.findAllByText(/25\.000,00\sJPY/)).length).toBeGreaterThan(0);
  });
});
