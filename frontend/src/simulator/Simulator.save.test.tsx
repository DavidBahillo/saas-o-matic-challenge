// Guardar simulación (RF25 a RF27, CA3): tabla "Guardar simulación" de la spec.
import type { Simulation } from '@saas-o-matic/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, saveButton, setField, total, ratesReady, waitForSimulator } from '../test/detail';
import { ACME, NEVER, SIMULATION_USD, apiError } from '../test/fixtures';
import type { MockReply } from '../test/mock-fetch';

const NBSP = String.fromCharCode(0xa0);
const SAVED_EUR: Simulation = {
  ...SIMULATION_USD,
  currency: 'EUR',
  exchangeRate: '1.000000',
  convertedBaseCents: 14000,
  convertedVatCents: 2940,
  convertedTotalCents: 16940,
};
const created = (body: Simulation): MockReply => ({ status: 201, body });
const POST = 'POST /api/simulations';
const selectCurrency = (user: ReturnType<typeof renderDetail>['user'], currency: string) =>
  user.selectOptions(screen.getByRole('combobox', { name: 'Divisa' }), currency);

async function ready(options: Parameters<typeof renderDetail>[0] = {}) {
  const view = renderDetail(options);
  await waitForSimulator();
  await ratesReady();
  setField('Usuarios', '15');
  return view;
}

describe('Guardar: solicitud (RF25, CA3)', () => {
  it('envía solo cinco claves y la divisa activa al pulsar "Guardar"', async () => {
    const { user, fetchMock } = await ready({ routes: { [POST]: created(SIMULATION_USD) } });
    setField('Almacenamiento (GB)', '3');
    await selectCurrency(user, 'USD');
    await selectCurrency(user, 'EUR');
    await user.click(saveButton());
    await screen.findByTestId('saved-quote');
    const body = fetchMock.callsTo(POST)[0]?.body;
    expect(Object.keys(body as object).sort()).toEqual(['apiCalls', 'currency', 'customerId', 'storage', 'users']);
    expect(body).toEqual({ customerId: 7, users: 15, storage: 3, apiCalls: 0, currency: 'EUR' });
  });

  it('en USD envía currency USD', async () => {
    const { user, fetchMock } = await ready({ routes: { [POST]: created(SIMULATION_USD) } });
    await selectCurrency(user, 'USD');
    await user.click(saveButton());
    await screen.findByTestId('saved-quote');
    expect(fetchMock.callsTo(POST)[0]?.body).toMatchObject({ currency: 'USD', users: 15 });
  });

  it('doble clic en "Guardar": una sola petición', async () => {
    const { user, fetchMock } = await ready({ routes: { [POST]: () => NEVER } });
    await user.dblClick(saveButton());
    expect(fetchMock.callsTo(POST)).toHaveLength(1);
    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });
});

describe('Guardar: resultado (RF26)', () => {
  it('15 usuarios en EUR: muestra los importes del backend, sin aviso de tipo', async () => {
    const { user } = await ready({ routes: { [POST]: created(SAVED_EUR) } });
    await user.click(saveButton());
    const saved = await screen.findByTestId('saved-quote');
    expect(within(saved).getByText('169,40 EUR', { selector: '[data-row="total"] td' })).toBeVisible();
    expect(screen.queryByText(/distinto del de la vista previa/)).toBeNull();
  });

  it('USD con tipo 1,12 y vista previa 1,10: importes del backend y aviso de tipo distinto', async () => {
    const backend: Simulation = { ...SIMULATION_USD, exchangeRate: '1.120000', convertedTotalCents: 18973 };
    const { user } = await ready({ routes: { [POST]: created(backend) } });
    await selectCurrency(user, 'USD');
    await user.click(saveButton());
    const saved = await screen.findByTestId('saved-quote');
    expect(within(saved).getByText('189,73 USD')).toBeVisible();
    expect(screen.getByText(/El tipo aplicado fue 1,12, distinto del de la vista previa/)).toBeVisible();
  });

  it('con el mismo tipo no hay aviso', async () => {
    const { user } = await ready({ routes: { [POST]: created(SIMULATION_USD) } });
    await selectCurrency(user, 'USD');
    await user.click(saveButton());
    await screen.findByTestId('saved-quote');
    expect(screen.queryByText(/distinto del de la vista previa/)).toBeNull();
  });

  it('conserva los valores, invalida cliente y simulaciones y la nueva aparece en la lista', async () => {
    let saved = false;
    const { user, fetchMock } = await ready({
      routes: {
        [POST]: () => {
          saved = true;
          return created(SAVED_EUR);
        },
        'GET /api/customers/7': () => ({ body: { ...ACME, simulationCount: saved ? 3 : 2 } }),
        'GET /api/customers/7/simulations': () => ({ body: { items: saved ? [SAVED_EUR] : [] } }),
      },
    });
    await user.click(saveButton());
    await screen.findByTestId('saved-quote');
    await waitFor(() => { expect(fetchMock.callsTo('GET /api/customers/7')).toHaveLength(2); });
    expect(fetchMock.callsTo('GET /api/customers/7/simulations')).toHaveLength(2);
    expect(await screen.findByRole('heading', { name: 'Simulaciones guardadas (3)' })).toBeVisible();
    expect(await screen.findByTestId('simulation-list')).toBeVisible();
    expect(screen.getByLabelText('Usuarios')).toHaveValue('15');
    expect(total().textContent).toBe(`169,40${NBSP}EUR`);
  });
});

describe('Guardar: errores (RF27)', () => {
  const fields = (...list: object[]) => apiError(400, 'VALIDATION_ERROR', 'Datos no válidos.', { fields: list });

  it('un 400 coloca cada error junto a su control y conserva lo introducido', async () => {
    const { user } = await ready({
      routes: {
        [POST]: fields(
          { field: 'users', code: 'INVALID_USERS', message: 'Usuarios no válidos.' },
          { field: 'storage', code: 'INVALID_RESOURCE', message: 'Almacenamiento no válido.' },
        ),
      },
    });
    await user.click(saveButton());
    await screen.findByText('Usuarios no válidos.');
    expect(screen.getByLabelText('Usuarios')).toHaveAccessibleDescription('Usuarios no válidos.');
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveAccessibleDescription('Almacenamiento no válido.');
    expect(screen.getByLabelText('Usuarios')).toHaveValue('15');
  });

  it('CURRENCY_NOT_AVAILABLE muestra el error de la divisa con su sugerencia', async () => {
    const { user } = await ready({
      routes: {
        [POST]: fields({
          field: 'currency',
          code: 'CURRENCY_NOT_AVAILABLE',
          message: 'Divisa no disponible.',
          suggestion: 'EUR, USD, GBP',
        }),
      },
    });
    await user.click(saveButton());
    expect(await screen.findByText('Divisa no disponible. Sugerencia: EUR, USD, GBP.')).toBeVisible();
  });

  it('un campo sin control va a un aviso general', async () => {
    const { user } = await ready({
      routes: { [POST]: fields({ field: 'customerId', code: 'INVALID_TYPE', message: 'Cliente no válido.' }) },
    });
    await user.click(saveButton());
    expect(await within(await screen.findByRole('alert')).findByText('Cliente no válido.')).toBeVisible();
  });

  it('404: "Cliente no encontrado"', async () => {
    const { user } = await ready({ routes: { [POST]: apiError(404, 'CUSTOMER_NOT_FOUND', 'No existe.') } });
    await user.click(saveButton());
    expect(await within(await screen.findByRole('alert')).findByText('Cliente no encontrado')).toBeVisible();
  });

  it('500 EXCHANGE_RATE_UNAVAILABLE: explica, ofrece "Reintentar" y "Guardar en EUR" y no guarda nada', async () => {
    let calls = 0;
    const { user, fetchMock } = await ready({
      routes: {
        [POST]: (call) => {
          calls += 1;
          return call.body !== undefined && (call.body as { currency: string }).currency === 'EUR' && calls > 1
            ? created(SAVED_EUR)
            : apiError(500, 'EXCHANGE_RATE_UNAVAILABLE', 'Tipos no disponibles.');
        },
      },
    });
    await selectCurrency(user, 'USD');
    await user.click(saveButton());
    expect(await screen.findByText(/No se pudo obtener el tipo de cambio/)).toBeVisible();
    expect(screen.queryByTestId('saved-quote')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(fetchMock.callsTo(POST)).toHaveLength(2); });
    expect(fetchMock.callsTo(POST)[1]?.body).toMatchObject({ currency: 'USD' });
    await user.click(await screen.findByRole('button', { name: 'Guardar en EUR' }));
    await screen.findByTestId('saved-quote');
    expect(fetchMock.callsTo(POST)[2]?.body).toMatchObject({ currency: 'EUR', users: 15 });
  });

  it('un 500 cualquiera o la red caída: error general con "Reintentar" y valores conservados', async () => {
    const { user } = await ready({ routes: { [POST]: 'network-error' } });
    await user.click(saveButton());
    expect(await screen.findByText(/Algo ha salido mal/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    expect(screen.getByLabelText('Usuarios')).toHaveValue('15');
  });
});
