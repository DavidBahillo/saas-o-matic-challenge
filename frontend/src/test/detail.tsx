// Ayudas para probar el detalle del cliente y su simulador.
import type { Customer, Simulation } from '@saas-o-matic/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { ACME } from './fixtures';
import type { MockHandler } from './mock-fetch';
import { renderApp } from './render';

export interface DetailOptions {
  customer?: Customer;
  simulations?: Simulation[];
  routes?: Record<string, MockHandler>;
  fakeTimers?: boolean;
}

/** Abre /customers/:id con el cliente y sus simulaciones ya servidos por el fetch sustituido. */
export function renderDetail({ customer = ACME, simulations = [], routes = {}, fakeTimers }: DetailOptions = {}) {
  const base = `/api/customers/${String(customer.id)}`;
  return renderApp({
    route: `/customers/${String(customer.id)}`,
    ...(fakeTimers === undefined ? {} : { fakeTimers }),
    routes: {
      [`GET ${base}`]: { body: customer },
      [`GET ${base}/simulations`]: { body: { items: simulations } },
      ...routes,
    },
  });
}

export const usersField = () => screen.getByLabelText('Usuarios');
export const slider = () => screen.getByRole('slider');
export const total = () => screen.getByTestId('total');
export const saveButton = () => screen.getByRole('button', { name: 'Guardar simulación' });

/** Cambia un campo de texto de golpe (los casos de la spec son valores completos, no pulsaciones). */
export function setField(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

export const waitForSimulator = (): Promise<HTMLElement> => screen.findByRole('button', { name: 'Guardar simulación' });

/** Espera a que los tipos de cambio estén cargados (alguna divisa distinta de EUR habilitada). */
export const ratesReady = (): Promise<void> =>
  waitFor(() => {
    const options = Array.from(screen.getByRole('combobox', { name: 'Divisa' }).querySelectorAll('option'));
    expect(options.some((o) => o.value !== 'EUR' && !o.disabled)).toBe(true);
  });
