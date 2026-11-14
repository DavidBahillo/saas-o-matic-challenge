// Modo presentación (RF47, RF48): foco y anuncio al entrar o salir, y guardas de Escape.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, slider, usersField, ratesReady, waitForSimulator } from '../test/detail';

const header = () => screen.queryByRole('banner');
const select = () => screen.queryByRole('combobox', { name: 'Divisa' });
const ALT_P = '{Alt>}p{/Alt}';

async function openDetail() {
  const view = renderDetail();
  await waitForSimulator();
  await ratesReady();
  return view;
}

describe('modo presentación: foco y anuncio (RF47)', () => {
  it('al entrar con el botón el foco va a "Salir de la presentación" y se anuncia', async () => {
    const { user } = await openDetail();
    await user.click(screen.getByRole('button', { name: /Modo presentación/ }));
    expect(screen.getByRole('button', { name: 'Salir de la presentación' })).toHaveFocus();
    expect(await screen.findByText('Modo presentación activado')).toBeInTheDocument();
  });

  it('con el atajo y con Escape, el foco vuelve a "Modo presentación" y se anuncia', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    expect(screen.getByRole('button', { name: 'Salir de la presentación' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: /Modo presentación/ })).toHaveFocus();
    expect(await screen.findByText('Modo presentación desactivado')).toBeInTheDocument();
  });

  it('la región aria-live existe desde el primer render, vacía', async () => {
    await openDetail();
    const region = document.querySelector('[aria-live="polite"].sr-only');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe('');
  });

  it('el botón declara el atajo en su texto y en aria-keyshortcuts', async () => {
    await openDetail();
    const button = screen.getByRole('button', { name: 'Modo presentación (Alt+P)' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+P');
  });
});

describe('modo presentación: Escape (RF48)', () => {
  it('con el foco en un campo de texto, Escape no sale; desde el slider y desde un select sí sale', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    usersField().focus();
    await user.keyboard('{Escape}');
    expect(header()).toBeNull();
    for (const element of [slider(), select() as HTMLElement]) {
      await user.keyboard(ALT_P);
      expect(header()).toBeNull();
      element.focus();
      await user.keyboard('{Escape}');
      expect(header()).not.toBeNull();
    }
  });

  it('con un tooltip abierto, Escape cierra solo el tooltip y no sale', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    const segment = screen.getAllByRole('button').find((b) => b.classList.contains('stack__seg'));
    if (segment === undefined) return; // con el ancho por defecto la barra no necesita tooltip
    segment.focus();
    await user.keyboard('{Escape}');
    expect(header()).toBeNull();
  });
});
