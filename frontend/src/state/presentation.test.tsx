// Modo presentación (RF30): tabla "Tema, presentación y teclado" de la spec.
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, slider, usersField, ratesReady, waitForSimulator } from '../test/detail';
import { ACME, RATES_UNAVAILABLE, customerList } from '../test/fixtures';
import { renderApp } from '../test/render';

const header = () => screen.queryByRole('banner');
const ALT_P = '{Alt>}p{/Alt}';
const select = () => screen.queryByRole('combobox', { name: 'Divisa' });

async function openDetail() {
  const view = renderDetail();
  await waitForSimulator();
  await ratesReady();
  return view;
}

describe('modo presentación: activar y salir', () => {
  it('Alt+P en el detalle fuera de un campo: sin header ni listas y con el selector de divisa visible', async () => {
    const { user } = await openDetail();
    expect(header()).not.toBeNull();
    await user.keyboard(ALT_P);
    expect(header()).toBeNull();
    expect(screen.queryByTestId('simulation-list')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Crear la primera simulación' })).toBeNull();
    expect(select()).toBeVisible();
    expect(screen.getByRole('button', { name: 'Guardar simulación' })).toBeVisible();
  });

  it('otro Alt+P sale de la presentación', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    await user.keyboard(ALT_P);
    expect(header()).not.toBeNull();
  });

  it('Esc sale de la presentación', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    await user.keyboard('{Escape}');
    expect(header()).not.toBeNull();
  });

  it('el botón de presentación activa y el de salida desactiva, sin perder los valores del simulador', async () => {
    const { user } = await openDetail();
    fireEvent.change(usersField(), { target: { value: '30' } });
    await user.click(screen.getByRole('button', { name: 'Presentar' }));
    expect(header()).toBeNull();
    expect(usersField()).toHaveValue('30');
    await user.click(screen.getByRole('button', { name: 'Salir de la presentación' }));
    expect(header()).not.toBeNull();
    expect(usersField()).toHaveValue('30');
  });
});

describe('modo presentación: barra mínima (RF-aviso, RF-tema3)', () => {
  it('solo tiene el selector de divisa y "Salir de la presentación", sin tema ni navegación', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    const exit = screen.getByRole('button', { name: 'Salir de la presentación' });
    const bar = exit.closest('.presentation-bar') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(within(bar).getByRole('combobox', { name: 'Divisa' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Salir de la presentación' })).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Tema' })).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('muestra el aviso de tipos con "Reintentar" si no hay tipos', async () => {
    const { user } = renderDetail({ routes: { 'GET /api/exchange-rates': RATES_UNAVAILABLE } });
    await waitForSimulator();
    await user.keyboard(ALT_P);
    expect(await screen.findByText('Tipos de cambio no disponibles')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });
});

describe('modo presentación: cuándo NO se activa', () => {
  it.each(['Control', 'Meta', 'Shift'])('con Alt y %s no se activa', async (modifier) => {
    const { user } = await openDetail();
    await user.keyboard(`{Alt>}{${modifier}>}p{/${modifier}}{/Alt}`);
    expect(header()).not.toBeNull();
  });

  it('P sola ya no activa la presentación', async () => {
    const { user } = await openDetail();
    await user.keyboard('p');
    expect(header()).not.toBeNull();
  });

  it('con el foco en el campo de usuarios (texto) no se activa', async () => {
    const { user } = await openDetail();
    usersField().focus();
    await user.keyboard(ALT_P);
    expect(header()).not.toBeNull();
  });

  it('con el foco en el slider o en un select (no escriben) sí se activa', async () => {
    for (const element of [slider, () => screen.getByRole('combobox', { name: 'Divisa' })]) {
      const { user, unmount } = await openDetail();
      element().focus();
      await user.keyboard(ALT_P);
      expect(header()).toBeNull();
      unmount();
    }
  });

  it('con el foco en un textarea no se activa', async () => {
    const { user } = await openDetail();
    const area = document.createElement('textarea');
    document.body.append(area);
    area.focus();
    await user.keyboard(ALT_P);
    expect(header()).not.toBeNull();
    area.remove();
  });

  it('en la lista no hace nada', async () => {
    const { user } = renderApp({ routes: { 'GET /api/customers': customerList([ACME]) } });
    await screen.findByText('Acme Ibérica SL');
    await user.keyboard(ALT_P);
    expect(header()).not.toBeNull();
  });

  it('en el alta no hace nada', async () => {
    const { user } = renderApp({ route: '/customers/new' });
    await user.keyboard(ALT_P);
    expect(header()).not.toBeNull();
  });
});

describe('modo presentación: contenido ampliado (RF30)', () => {
  it('muestra cifra de usuarios, escalera, slider y hoja a ×1,25, sin contexto, recursos ni explicación', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    expect(screen.getByRole('region', { name: 'Simulador' })).toHaveClass('workspace--presentation');
    expect(usersField()).toBeVisible();
    expect(screen.getByRole('list', { name: 'Precio por usuario según tramo' })).toBeVisible();
    expect(slider()).toBeVisible();
    expect(screen.getByRole('region', { name: 'Presupuesto' })).toBeVisible();
    expect(screen.getByTestId('total')).toBeVisible();
    expect(screen.queryByText('Recursos que no suman al precio')).toBeNull();
    expect(screen.queryByText(/Cada tramo cobra solo/)).toBeNull();
    expect(screen.queryByText(/Cliente desde/)).toBeNull();
    expect(screen.queryByRole('region', { name: 'Datos del cliente' })).toBeNull();
  });

  it('al salir vuelven el contexto y los recursos', async () => {
    const { user } = await openDetail();
    await user.keyboard(ALT_P);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('region', { name: 'Datos del cliente' })).toBeVisible();
    expect(screen.getByText('Recursos que no suman al precio')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Simulador' })).not.toHaveClass('workspace--presentation');
  });
});
