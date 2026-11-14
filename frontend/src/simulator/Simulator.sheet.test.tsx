// Composición del simulador (RF23 a RF28, RF45): escalera, explicación, recursos y hoja "Presupuesto".
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ratesReady, renderDetail, saveButton, setField, slider, total, usersField, waitForSimulator } from '../test/detail';
import { ACME } from '../test/fixtures';

const NBSP = String.fromCharCode(0xa0);
const money = (text: string) => text.replace(' ', NBSP);
const ladder = () => screen.getByRole('list', { name: 'Precio por usuario según tramo' });
const sheet = () => screen.getByRole('region', { name: 'Presupuesto' });

async function open(users?: string) {
  const view = renderDetail({ customer: ACME });
  await waitForSimulator();
  if (users !== undefined) setField('Usuarios', users);
  return view;
}

describe('Configuración de usuarios y escalera (RF23, RF24, RF25)', () => {
  it('muestra el título, la cifra con la etiqueta "Usuarios" y la escalera de tres escalones', async () => {
    await open('23');
    expect(screen.getByRole('heading', { name: '¿Cuántos usuarios?' })).toBeVisible();
    expect(usersField()).toHaveValue('23');
    const items = within(ladder()).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveTextContent(`8,00 EUR`);
    expect(items[1]).toHaveTextContent('11–50');
  });

  it('tres cuadrados iguales: sin ancho ni alto en línea y sin leyenda bajo el slider (RF43)', async () => {
    await open();
    const items = within(ladder()).getAllByRole('listitem');
    for (const li of items) expect(li.getAttribute('style') ?? '').not.toMatch(/width|height/);
    expect(ladder().getAttribute('style')).toBeNull();
    expect(screen.queryByTestId('ladder-legend')).toBeNull();
  });

  it('el tramo no alcanzado se atenúa y dice "no alcanzado" solo para lectores; cambia con el slider', async () => {
    await open('23');
    const items = () => within(ladder()).getAllByRole('listitem');
    expect(items()[2]).toHaveClass('ladder__step--dim');
    expect(items()[2]).toHaveTextContent('no alcanzado');
    expect(items()[1]).not.toHaveTextContent('no alcanzado');
    fireEvent.change(slider(), { target: { value: '60' } });
    expect(items()[2]).not.toHaveClass('ladder__step--dim');
  });

  it('la explicación sigue al número de usuarios', async () => {
    await open();
    expect(screen.getByText(/Con 10 usuarios pagas 10 al precio del tramo 1\./)).toBeVisible();
    setField('Usuarios', '23');
    expect(screen.getByText(/Con 23 usuarios pagas 10 al precio del tramo 1 y 13 al del tramo 2\./)).toBeVisible();
    setField('Usuarios', '0');
    expect(screen.getByText(/Con 0 usuarios el importe es 0\./)).toBeVisible();
  });
});

describe('Recursos (RF27)', () => {
  it('van en un <details> abierto por defecto con el título "Recursos que no suman al precio"', async () => {
    await open();
    const summary = screen.getByText('Recursos que no suman al precio');
    const details = summary.closest('details');
    expect(details?.open).toBe(true);
    expect(within(details as HTMLElement).getByLabelText('Almacenamiento (GB)')).toBeVisible();
    expect(within(details as HTMLElement).getByLabelText('Llamadas a la API (al mes)')).toBeVisible();
  });

  it('con un error el <details> sigue abierto y el error se ve', async () => {
    await open();
    const details = screen.getByText('Recursos que no suman al precio').closest('details');
    setField('Almacenamiento (GB)', '-1');
    expect(details?.open).toBe(true);
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveAccessibleDescription(/.+/);
  });
});

describe('Hoja "Presupuesto" (RF45, RF-importes)', () => {
  it('agrupa chip de divisa, total en EUR, barra, tabla y guardar, sin los textos retirados', async () => {
    await open('15');
    const view = within(sheet());
    expect(view.getByRole('heading', { name: 'Presupuesto' })).toBeVisible();
    expect(view.getByText('EUR', { selector: '.badge' })).toBeVisible();
    expect(view.getByTestId('total').textContent).toBe(money('169,40 EUR'));
    expect(view.getByTestId('stack-bar')).toBeVisible();
    expect(view.getByRole('table')).toBeVisible();
    expect(view.getByRole('button', { name: 'Guardar simulación' })).toBe(saveButton());
    expect(sheet()).not.toHaveTextContent(/IVA incluido|Tipos actualizados/);
    expect(screen.queryByTestId('sheet-base')).toBeNull();
    expect(screen.queryByTestId('sheet-vat')).toBeNull();
  });

  it('con USD el total grande sigue en EUR y la vista previa convertida queda bajo el total', async () => {
    const { user } = await open('15');
    await ratesReady();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Divisa' }), 'USD');
    const view = within(sheet());
    expect(view.getByTestId('total').textContent).toBe(money('169,40 EUR'));
    expect(view.getByText('USD', { selector: '.badge' })).toBeVisible();
    const preview = view.getByTestId('converted-preview');
    expect(view.getByTestId('total').compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(preview.compareDocumentPosition(view.getByTestId('stack-bar')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(total()).toBeVisible();
  });

  it('el aviso de guardado queda fuera de la hoja', async () => {
    const { user } = await open('15');
    await user.click(saveButton());
    const alert = await screen.findByRole('alert');
    expect(sheet().contains(alert)).toBe(false);
  });
});

describe('Barra sin importes (RF14, RF41)', () => {
  it('los segmentos completos no usan title ni tooltip y no llevan importes', async () => {
    await open('15');
    const bar = screen.getByTestId('stack-bar');
    expect(bar.querySelectorAll('[title]')).toHaveLength(0);
    expect(bar.querySelectorAll('.tooltip__bubble')).toHaveLength(0);
    expect(within(bar).getByText('Tramo 1')).toBeVisible();
    expect(bar.textContent).not.toMatch(/EUR/);
  });
});
