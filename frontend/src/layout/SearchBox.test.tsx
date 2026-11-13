import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { renderApp } from '../test/render';

beforeEach(useFakeClock);
afterEach(useRealClock);

const search = () => screen.getByRole('searchbox', { name: 'Buscar clientes' });
const location = () => screen.getByTestId('location').textContent;
const advance = (ms: number) => { act(() => void vi.advanceTimersByTime(ms)); };

describe('SearchBox (RF6, RF7, V2)', () => {
  it('tiene maxLength 100', () => {
    renderApp({ fakeTimers: true });
    expect(search()).toHaveAttribute('maxlength', '100');
  });

  it('espera 300 ms antes de escribir ?q= en la URL', async () => {
    const { user } = renderApp({ fakeTimers: true });
    await user.type(search(), 'acme');
    advance(299);
    expect(location()).toBe('/');
    advance(1);
    expect(location()).toBe('/?q=acme');
  });

  it('varias pulsaciones seguidas dejan una sola búsqueda con el último texto', async () => {
    const { user } = renderApp({ fakeTimers: true });
    await user.type(search(), 'a');
    await user.type(search(), 'c');
    await user.type(search(), 'm');
    advance(300);
    expect(location()).toBe('/?q=acm');
  });

  it('conserva los espacios que se están escribiendo en el campo', async () => {
    const { user } = renderApp({ fakeTimers: true });
    await user.type(search(), 'acme ');
    advance(300);
    expect(location()).toBe('/?q=acme');
    expect(search()).toHaveValue('acme ');
  });

  it('con solo espacios vuelve a la lista completa', async () => {
    const { user } = renderApp({ route: '/?q=acme', fakeTimers: true });
    await user.clear(search());
    await user.type(search(), '   ');
    advance(300);
    expect(location()).toBe('/');
  });

  it('desde otra pantalla navega a /?q= (RF7)', async () => {
    const { user } = renderApp({ route: '/customers/7', fakeTimers: true });
    await user.type(search(), 'acme');
    advance(300);
    expect(location()).toBe('/?q=acme');
  });

  it('desde otra pantalla un texto vacío no navega', async () => {
    const { user } = renderApp({ route: '/customers/7', fakeTimers: true });
    await user.type(search(), ' ');
    advance(300);
    expect(location()).toBe('/customers/7');
  });

  it('carga el q de la URL en el campo (recarga)', () => {
    renderApp({ route: '/?q=acme', fakeTimers: true });
    expect(search()).toHaveValue('acme');
  });

  it('se sincroniza cuando la URL cambia desde fuera', async () => {
    const { user } = renderApp({ route: '/?q=acme', fakeTimers: true });
    await user.click(screen.getByRole('link', { name: 'SaaS-O-Matic' }));
    expect(location()).toBe('/');
    expect(search()).toHaveValue('');
  });
});
