import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/render';

describe('rutas (V1)', () => {
  it.each([
    ['/', 'Clientes'],
    ['/customers/new', 'Nuevo cliente'],
  ])('%s muestra su pantalla con el header', (route, heading) => {
    renderApp({ route });
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(screen.getByRole('banner')).toBeVisible();
  });

  it.each([['/foo'], ['/customers'], ['/customers/7/extra']])('%s muestra "No encontrado" con enlace al inicio', async (route) => {
    const { user } = renderApp({ route });
    expect(screen.getByRole('heading', { name: 'No encontrado' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Volver al inicio' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  });

  it('el logo del header lleva a /', async () => {
    const { user } = renderApp({ route: '/customers/new' });
    await user.click(screen.getByRole('link', { name: 'SaaS-O-Matic' }));
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  });
});
