import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

afterEach(() => { document.documentElement.removeAttribute('data-theme'); });

const light = () => screen.getByRole('button', { name: 'Tema claro' });
const dark = () => screen.getByRole('button', { name: 'Tema oscuro' });

describe('ThemeToggle (RF-tema3, RF-tema4)', () => {
  it('muestra siempre dos botones con icono y sin texto visible, dentro de un grupo "Tema"', () => {
    renderApp();
    const group = screen.getByRole('group', { name: 'Tema' });
    expect(group).toContainElement(light());
    expect(group).toContainElement(dark());
    for (const button of [light(), dark()]) {
      expect(button.textContent).toBe('');
      expect(button.querySelector('svg')).not.toBeNull();
    }
  });

  it('sin preferencia guardada el oscuro está pulsado y es el activo', () => {
    renderApp();
    expect(dark()).toHaveAttribute('aria-pressed', 'true');
    expect(light()).toHaveAttribute('aria-pressed', 'false');
    expect(dark()).toHaveClass('theme-toggle__btn--active');
    expect(light()).not.toHaveClass('theme-toggle__btn--active');
  });

  it('al pulsar el claro guarda som-theme, cambia data-theme y mueve aria-pressed', async () => {
    const { user } = renderApp();
    await user.click(light());
    expect(window.localStorage.getItem('som-theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(light()).toHaveAttribute('aria-pressed', 'true');
    expect(dark()).toHaveAttribute('aria-pressed', 'false');
    await user.click(dark());
    expect(window.localStorage.getItem('som-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('pulsar el botón ya activo no cambia nada', async () => {
    const { user } = renderApp();
    await user.click(dark());
    expect(dark()).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('som-theme')).toBeNull();
  });

  it('con "light" guardado el claro es el pulsado', () => {
    window.localStorage.setItem('som-theme', 'light');
    renderApp();
    expect(light()).toHaveAttribute('aria-pressed', 'true');
  });

  it('un valor guardado desconocido cuenta como oscuro', () => {
    window.localStorage.setItem('som-theme', 'foo');
    renderApp();
    expect(dark()).toHaveAttribute('aria-pressed', 'true');
  });
});
