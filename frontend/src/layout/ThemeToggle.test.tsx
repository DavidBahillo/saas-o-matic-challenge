import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

afterEach(() => { document.documentElement.removeAttribute('data-theme'); });

describe('ThemeToggle (RF29)', () => {
  it('sin preferencia guardada ofrece pasar de oscuro a claro', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeVisible();
  });

  it('al pulsar guarda som-theme y cambia data-theme', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }));
    expect(window.localStorage.getItem('som-theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }));
    expect(window.localStorage.getItem('som-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('con "light" guardado el botón ofrece volver al oscuro', () => {
    window.localStorage.setItem('som-theme', 'light');
    renderApp();
    expect(screen.getByRole('button', { name: 'Cambiar a tema oscuro' })).toBeVisible();
  });

  it('un valor guardado desconocido cuenta como oscuro', () => {
    window.localStorage.setItem('som-theme', 'foo');
    renderApp();
    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeVisible();
  });
});
