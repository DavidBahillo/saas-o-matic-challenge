// Modo presentación (RF30): tabla "Tema, presentación y teclado" de la spec.
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, slider, usersField, waitForSimulator } from '../test/detail';
import { ACME, customerList } from '../test/fixtures';
import { renderApp } from '../test/render';

const header = () => screen.queryByRole('banner');
const select = () => screen.queryByRole('combobox', { name: 'Divisa' });

async function openDetail() {
  const view = renderDetail();
  await waitForSimulator();
  await screen.findByText(/Tipos actualizados/);
  return view;
}

describe('modo presentación: activar y salir', () => {
  it('P en el detalle fuera de un campo: sin header ni listas y con el selector de divisa visible', async () => {
    const { user } = await openDetail();
    expect(header()).not.toBeNull();
    await user.keyboard('p');
    expect(header()).toBeNull();
    expect(screen.queryByTestId('simulation-list')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Crear la primera simulación' })).toBeNull();
    expect(select()).toBeVisible();
    expect(screen.getByRole('button', { name: 'Guardar simulación' })).toBeVisible();
  });

  it('otra P sale de la presentación', async () => {
    const { user } = await openDetail();
    await user.keyboard('p');
    await user.keyboard('p');
    expect(header()).not.toBeNull();
  });

  it('Esc sale de la presentación', async () => {
    const { user } = await openDetail();
    await user.keyboard('p');
    await user.keyboard('{Escape}');
    expect(header()).not.toBeNull();
  });

  it('el botón de presentación activa y el de salida desactiva, sin perder los valores del simulador', async () => {
    const { user } = await openDetail();
    fireEvent.change(usersField(), { target: { value: '30' } });
    await user.click(screen.getByRole('button', { name: 'Modo presentación' }));
    expect(header()).toBeNull();
    expect(usersField()).toHaveValue('30');
    await user.click(screen.getByRole('button', { name: 'Salir de la presentación' }));
    expect(header()).not.toBeNull();
    expect(usersField()).toHaveValue('30');
  });
});

describe('modo presentación: cuándo NO se activa', () => {
  it.each(['Control', 'Alt', 'Meta', 'Shift'])('con %s no se activa', async (modifier) => {
    const { user } = await openDetail();
    await user.keyboard(`{${modifier}>}p{/${modifier}}`);
    expect(header()).not.toBeNull();
  });

  it('con el foco en el buscador, el campo de usuarios, un select o el slider no se activa', async () => {
    const { user } = await openDetail();
    for (const element of [
      screen.getByRole('searchbox', { name: 'Buscar clientes' }),
      usersField(),
      screen.getByRole('combobox', { name: 'Divisa' }),
      slider(),
    ]) {
      element.focus();
      await user.keyboard('p');
      expect(header()).not.toBeNull();
    }
  });

  it('con el foco en un textarea no se activa', async () => {
    const { user } = await openDetail();
    const area = document.createElement('textarea');
    document.body.append(area);
    area.focus();
    await user.keyboard('p');
    expect(header()).not.toBeNull();
    area.remove();
  });

  it('en la lista no hace nada', async () => {
    const { user } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    await screen.findByText('Acme Ibérica SL');
    await user.keyboard('p');
    expect(header()).not.toBeNull();
  });

  it('en el alta no hace nada', async () => {
    const { user } = renderApp({ route: '/customers/new' });
    await user.keyboard('p');
    expect(header()).not.toBeNull();
  });
});
