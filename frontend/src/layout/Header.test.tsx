import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail } from '../test/detail';
import { ACME } from '../test/fixtures';
import { renderApp } from '../test/render';

const nav = () => screen.getByRole('link', { name: 'Clientes' });

describe('Header (RF18)', () => {
  it('muestra la marca como enlace a /, la navegación, la divisa y el tema', () => {
    renderApp();
    expect(screen.getByRole('link', { name: 'SaaS-O-Matic' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('navigation')).toContainElement(nav());
    expect(screen.getByRole('combobox', { name: 'Divisa' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Tema' })).toBeVisible();
  });

  it('la cabecera global no tiene buscador', () => {
    renderApp();
    expect(screen.getByRole('banner').querySelector('input[type="search"]')).toBeNull();
  });

  it('en / el enlace Clientes tiene indicador y aria-current="page"', () => {
    renderApp({ route: '/' });
    expect(nav()).toHaveAttribute('aria-current', 'page');
    expect(nav()).toHaveClass('nav__link--active');
  });

  it('en /customers/:id tiene indicador pero no aria-current', async () => {
    renderDetail();
    await screen.findByRole('heading', { level: 1, name: ACME.companyName });
    expect(nav()).toHaveClass('nav__link--active');
    expect(nav()).not.toHaveAttribute('aria-current');
  });

  it('en /customers/new tiene indicador pero no aria-current', () => {
    renderApp({ route: '/customers/new' });
    expect(nav()).toHaveClass('nav__link--active');
    expect(nav()).not.toHaveAttribute('aria-current');
  });

  it('en una ruta desconocida no hay indicador ni aria-current', () => {
    renderApp({ route: '/nada' });
    expect(nav()).not.toHaveClass('nav__link--active');
    expect(nav()).not.toHaveAttribute('aria-current');
  });

  it('la cabecera no muestra atribución de proveedor ni pie de tipos', async () => {
    renderApp();
    await screen.findByRole('combobox', { name: 'Divisa' });
    expect(screen.queryByText(/ExchangeRate-API/i)).toBeNull();
    expect(screen.getByRole('banner')).not.toHaveTextContent(/Tipos actualizados/);
  });

  it('el enlace "Saltar al contenido" es el primer enfocable y lleva el foco a <main>', async () => {
    const { user } = renderApp();
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
  });
});
