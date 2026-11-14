// Título de pestaña por ruta (WIG): lista, alta, detalle y 404.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail } from '../test/detail';
import { ACME } from '../test/fixtures';
import { renderApp } from '../test/render';

describe('título de la pestaña', () => {
  it('lista de clientes', () => {
    renderApp();
    expect(document.title).toBe('Clientes · SaaS-O-Matic');
  });

  it('alta de cliente', () => {
    renderApp({ route: '/customers/new' });
    expect(document.title).toBe('Nuevo cliente · SaaS-O-Matic');
  });

  it('ruta desconocida', () => {
    renderApp({ route: '/nada' });
    expect(document.title).toBe('Página no encontrada · SaaS-O-Matic');
  });

  it('detalle: el nombre de la empresa', async () => {
    renderDetail({ customer: ACME });
    await screen.findByRole('heading', { name: ACME.companyName });
    expect(document.title).toBe(`${ACME.companyName} · SaaS-O-Matic`);
  });
});
