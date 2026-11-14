import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RATES_BODY, RATES_UNAVAILABLE } from '../test/fixtures';
import { renderApp } from '../test/render';

describe('CurrencyNotice (RF-aviso)', () => {
  it('con tipos disponibles no muestra aviso', async () => {
    renderApp();
    await waitFor(() => { expect(screen.getByRole('option', { name: /^USD/ })).toBeEnabled(); });
    expect(screen.queryByText('Tipos de cambio no disponibles')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('si fallan todos los tipos muestra el aviso con "Reintentar" bajo la cabecera', async () => {
    renderApp({ routes: { 'GET /api/exchange-rates': RATES_UNAVAILABLE } });
    const text = await screen.findByText('Tipos de cambio no disponibles');
    expect(text.closest('.notice')).not.toBeNull();
    const header = screen.getByRole('banner');
    expect(header).not.toContainElement(text);
    expect(header.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });

  it('al reintentar con éxito desaparece el aviso', async () => {
    let attempts = 0;
    const { user } = renderApp({
      routes: { 'GET /api/exchange-rates': () => (++attempts === 1 ? RATES_UNAVAILABLE : { body: RATES_BODY }) },
    });
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(screen.queryByText('Tipos de cambio no disponibles')).toBeNull(); });
  });
});
