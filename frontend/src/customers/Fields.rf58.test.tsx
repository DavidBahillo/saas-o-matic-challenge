// RF58: opciones y placeholders del alta, translate="no" en chips de plan y divisa.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, waitForSimulator } from '../test/detail';
import { ACME, customerList } from '../test/fixtures';
import { renderApp } from '../test/render';

describe('alta: plan y ejemplos (RF58)', () => {
  it('el desplegable de plan muestra Starter, Growth y Enterprise y envía starter, growth y enterprise', () => {
    renderApp({ route: '/customers/new' });
    const options = within(screen.getByRole('combobox', { name: 'Plan' })).getAllByRole<HTMLOptionElement>('option');
    expect(options.map((o) => [o.textContent, o.value])).toEqual([
      ['Starter', 'starter'],
      ['Growth', 'growth'],
      ['Enterprise', 'enterprise'],
    ]);
  });

  it('NIF y correo llevan ejemplo, sin corrector y el correo con teclado de correo', () => {
    renderApp({ route: '/customers/new' });
    const nif = screen.getByLabelText('Identificador fiscal');
    const email = screen.getByLabelText('Email');
    expect(nif).toHaveAttribute('placeholder', 'Ej.: 12345678Z…');
    expect(nif).toHaveAttribute('spellcheck', 'false');
    expect(email).toHaveAttribute('placeholder', 'nombre@empresa.com…');
    expect(email).toHaveAttribute('spellcheck', 'false');
    expect(email).toHaveAttribute('inputmode', 'email');
  });
});

describe('translate="no" (RF58)', () => {
  it('el chip de plan de la lista y los de plan y divisa del detalle no se traducen', async () => {
    const { unmount } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    const row = (await screen.findByRole('link', { name: 'Acme Ibérica SL' })).closest('tr') as HTMLElement;
    expect(within(row).getByText('growth')).toHaveAttribute('translate', 'no');
    unmount();
    renderDetail();
    await waitForSimulator();
    expect(screen.getByText('EUR', { selector: '.badge' })).toHaveAttribute('translate', 'no');
    expect(screen.getByText('growth', { selector: '.badge' })).toHaveAttribute('translate', 'no');
  });
});
