import { CURRENCIES } from '@saas-o-matic/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RATES_BODY, RATES_UNAVAILABLE, ratesBody } from '../test/fixtures';
import { renderDetail } from '../test/detail';
import { renderApp } from '../test/render';

const select = () => screen.getByRole('combobox', { name: 'Divisa' });
const option = (name: string): HTMLOptionElement => {
  const found = Array.from(select().querySelectorAll('option')).find((o) => o.value === name);
  if (found === undefined) throw new Error(`sin opción ${name}`);
  return found;
};

describe('CurrencySelect con tipos disponibles (RF28)', () => {
  it('lista las 23 divisas de shared con EUR primero y su nombre en español (RF9)', async () => {
    renderApp();
    await screen.findByText(/Tipos actualizados/);
    const options = Array.from(select().querySelectorAll('option'));
    expect(options.map((o) => o.value)).toEqual([...CURRENCIES]);
    expect(options[0]?.value).toBe('EUR');
    expect(options).toHaveLength(23);
    for (const o of options) expect(o.textContent).toMatch(new RegExp(`^${o.value} · .+`));
    expect(option('USD')).toBeEnabled();
    expect(option('GBP')).toBeEnabled();
    expect(select()).toHaveValue('EUR');
  });

  it('las divisas sin tipo se deshabilitan solas, sin badge (RF9, RF24)', async () => {
    renderApp({ routes: { 'GET /api/exchange-rates': { body: ratesBody(['USD', 'CHF']) } } });
    await screen.findByText(/Tipos actualizados/);
    expect(option('USD')).toBeEnabled();
    expect(option('CHF')).toBeEnabled();
    expect(option('SEK')).toBeDisabled();
    expect(option('SEK').textContent).toMatch(/sin tipo de cambio/);
    expect(option('EUR')).toBeEnabled();
    expect(screen.queryByText('Tipos de cambio no disponibles')).not.toBeInTheDocument();
  });

  it('el enlace de atribución junto al pie, con rel y href (RF12)', async () => {
    renderApp();
    const link = await screen.findByRole('link', { name: 'Tipos de cambio por ExchangeRate-API' });
    expect(link).toHaveAttribute('href', 'https://www.exchangerate-api.com');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('la atribución también está en modo presentación (RF12)', async () => {
    const { user } = renderDetail();
    await screen.findByText(/Tipos actualizados/);
    await user.click(await screen.findByRole('button', { name: 'Modo presentación' }));
    const bar = document.querySelector<HTMLElement>('.presentation-bar');
    expect(bar).not.toBeNull();
    expect(within(bar as HTMLElement).getByRole('link', { name: 'Tipos de cambio por ExchangeRate-API' })).toBeVisible();
  });

  it('el pie muestra la hora local más antigua (V5)', async () => {
    renderApp();
    expect(await screen.findByText('Tipos actualizados: 09:00')).toBeVisible();
  });

  it('cambiar de divisa la deja activa', async () => {
    const { user } = renderApp();
    await screen.findByText(/Tipos actualizados/);
    await user.selectOptions(select(), 'USD');
    expect(select()).toHaveValue('USD');
  });

  it('pide los tipos una sola vez al arrancar (V6)', async () => {
    const { fetchMock } = renderApp();
    await screen.findByText(/Tipos actualizados/);
    expect(fetchMock.callsTo('GET /api/exchange-rates')).toHaveLength(1);
  });
});

describe('CurrencySelect con tipos no disponibles (RF24, U7)', () => {
  it('deshabilita USD y GBP, deja EUR y muestra el badge con "Reintentar"', async () => {
    const { fetchMock } = renderApp({ routes: { 'GET /api/exchange-rates': RATES_UNAVAILABLE } });
    expect(await screen.findByText('Tipos de cambio no disponibles')).toBeVisible();
    expect(option('USD')).toBeDisabled();
    expect(option('GBP')).toBeDisabled();
    expect(option('EUR')).toBeEnabled();
    expect(select()).toHaveValue('EUR');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    expect(screen.queryByText(/Tipos actualizados/)).not.toBeInTheDocument();
    expect(fetchMock.callsTo('GET /api/exchange-rates')).toHaveLength(1);
  });

  it('la red caída y un cuerpo inesperado se tratan igual', async () => {
    renderApp({ routes: { 'GET /api/exchange-rates': 'network-error' } });
    expect(await screen.findByText('Tipos de cambio no disponibles')).toBeVisible();
    expect(option('USD')).toBeDisabled();
  });

  it('un 200 con forma inesperada también deshabilita USD y GBP', async () => {
    renderApp({ routes: { 'GET /api/exchange-rates': { body: { rates: 1 } } } });
    expect(await screen.findByText('Tipos de cambio no disponibles')).toBeVisible();
    expect(option('GBP')).toBeDisabled();
  });

  it('al reintentar con éxito se habilitan sin cambiar la divisa activa', async () => {
    let attempts = 0;
    const { user, fetchMock } = renderApp({
      routes: {
        'GET /api/exchange-rates': () => (++attempts === 1 ? RATES_UNAVAILABLE : { body: RATES_BODY }),
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(option('USD')).toBeEnabled());
    expect(option('GBP')).toBeEnabled();
    expect(select()).toHaveValue('EUR');
    expect(screen.queryByText('Tipos de cambio no disponibles')).not.toBeInTheDocument();
    expect(await screen.findByText('Tipos actualizados: 09:00')).toBeVisible();
    expect(fetchMock.callsTo('GET /api/exchange-rates')).toHaveLength(2);
  });

  it('si falla el reintento sigue deshabilitado', async () => {
    const { user, fetchMock } = renderApp({ routes: { 'GET /api/exchange-rates': RATES_UNAVAILABLE } });
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(fetchMock.callsTo('GET /api/exchange-rates')).toHaveLength(2); });
    expect(option('USD')).toBeDisabled();
  });
});
