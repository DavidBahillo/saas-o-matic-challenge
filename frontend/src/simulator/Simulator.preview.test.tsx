// Vista previa del simulador (RF19 a RF23, RF40): tablas "Tramos e IVA", "Control de usuarios" y "Divisa" de la spec.
import { calculateQuote } from '@saas-o-matic/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatMoney } from '../lib/format-money';
import { renderDetail, saveButton, setField, slider, total, usersField, waitForSimulator } from '../test/detail';
import { makeCustomer } from '../test/fixtures';

const NBSP = String.fromCharCode(0xa0);
const money = (text: string) => text.replace(' ', NBSP);

async function openFor(country: string, users?: string) {
  const view = renderDetail({ customer: makeCustomer({ country }) });
  await waitForSimulator();
  if (users !== undefined) setField('Usuarios', users);
  return view;
}

describe('Simulador: total y tramos (RF19, RF21)', () => {
  it('arranca con 10 usuarios, storage 0 y apiCalls 0', async () => {
    await openFor('ES');
    expect(usersField()).toHaveValue('10');
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveValue('0');
    expect(screen.getByLabelText('Llamadas a la API (al mes)')).toHaveValue('0');
    expect(total()).toHaveTextContent('121,00 EUR');
  });

  it.each([
    ['0', '0,00 EUR'],
    ['1', '12,10 EUR'],
    ['10', '121,00 EUR'],
    ['11', '130,68 EUR'],
    ['50', '508,20 EUR'],
    ['51', '514,25 EUR'],
  ])('ES con %s usuarios: total %s', async (users, expected) => {
    await openFor('ES', users);
    expect(total().textContent).toBe(money(expected));
  });

  it.each([
    ['ES', '605.205,70 EUR'],
    ['PT', '615.209,10 EUR'],
  ])('100 000 usuarios en %s: total %s', async (country, expected) => {
    await openFor(country, '100000');
    expect(total().textContent).toBe(money(expected));
  });

  it.each(['ES', 'PT', 'US'])('coherencia con calculateQuote para %s (CA2)', async (country) => {
    await openFor(country);
    for (const users of [0, 1, 10, 11, 50, 51]) {
      setField('Usuarios', String(users));
      const result = calculateQuote({ users, country });
      if (!result.ok) throw new Error('cálculo no válido');
      expect(total().textContent).toBe(formatMoney(result.value.totalCents, 'EUR'));
    }
  });

  it('tabla: siempre los tres tramos, base, tipo de IVA, IVA y total; con IVA 0 % la fila sigue visible', async () => {
    await openFor('US', '15');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').map((r) => r.textContent);
    expect(rows.filter((r) => r.startsWith('Tramo'))).toHaveLength(3);
    expect(within(table).getByText('140,00 EUR', { selector: '[data-row="base"] td' })).toBeVisible();
    expect(within(table).getByText('IVA (0 %)')).toBeVisible();
    expect(within(table).getByText('0,00 EUR', { selector: '[data-row="vat"] td' })).toBeVisible();
    expect(rows.find((r) => r.startsWith(`Tramo${String.fromCharCode(0xa0)}3`))).toContain(money('0,00 EUR'));
  });

  it('con 0 usuarios la tabla sigue mostrando los tres tramos', async () => {
    await openFor('ES', '0');
    const tiers = within(screen.getByRole('table')).getAllByRole('row').filter((r) => /^Tramo/.test(r.textContent));
    expect(tiers).toHaveLength(3);
  });
});

describe('Simulador: gráfico (RF21, RF40)', () => {
  it('15 usuarios: título y el nombre de cada tramo dentro del segmento, sin subtítulo', async () => {
    await openFor('US', '15');
    expect(screen.getByRole('heading', { name: 'Desglose del coste mensual' })).toBeVisible();
    expect(screen.queryByText(/sale del tramo/)).toBeNull();
    const bar = screen.getByTestId('stack-bar');
    expect(within(bar).getByText('Tramo 1')).toBeVisible();
    expect(within(bar).getByText('Tramo 2')).toBeVisible();
  });

  it('11 usuarios: el tramo 2 es estrecho, sin texto visible, enfocable y sin leyenda bajo la barra', async () => {
    await openFor('ES', '11');
    const bar = screen.getByTestId('stack-bar');
    const segment = within(bar).getByRole('button', { name: /Tramo.2/ });
    expect(segment.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByTestId('stack-outside')).toBeNull();
  });

  it('0 usuarios: sin segmentos y sin porcentaje', async () => {
    await openFor('ES', '0');
    expect(screen.queryByText(/sale del tramo/)).toBeNull();
    // Los segmentos salen con una transición y se desmontan al terminar (RF19).
    await waitFor(() => { expect(screen.getByTestId('stack-bar').children).toHaveLength(0); });
  });
});

describe('Simulador: control de usuarios (RF20, RF22)', () => {
  it('el slider va de 0 a 100 con paso 1 y marcas de texto en 10 y 50', async () => {
    await openFor('ES');
    expect(slider()).toHaveAttribute('min', '0');
    expect(slider()).toHaveAttribute('max', '100');
    expect(slider()).toHaveAttribute('step', '1');
    const marks = screen.getByTestId('slider-marks');
    expect(within(marks).getByText('10')).toBeVisible();
    expect(within(marks).getByText('50')).toBeVisible();
  });

  it('mover el slider escribe su valor en el campo y recalcula', async () => {
    await openFor('ES');
    fireEvent.change(slider(), { target: { value: '11' } });
    expect(usersField()).toHaveValue('11');
    expect(total().textContent).toBe(money('130,68 EUR'));
    fireEvent.change(slider(), { target: { value: '0' } });
    expect(usersField()).toHaveValue('0');
    expect(total().textContent).toBe(money('0,00 EUR'));
  });

  it('con más de 100 el slider queda en 100 y el campo y el total siguen con el valor escrito', async () => {
    await openFor('ES', '5000');
    expect(slider()).toHaveValue('100');
    expect(usersField()).toHaveValue('5000');
    expect(total().textContent).not.toBe(money('121,00 EUR'));
  });

  it('"  25  " son 25 usuarios y "0010" son 10', async () => {
    await openFor('ES', '  25  ');
    expect(slider()).toHaveValue('25');
    setField('Usuarios', '0010');
    expect(slider()).toHaveValue('10');
    expect(total().textContent).toBe(money('121,00 EUR'));
  });

  it.each(['100001', '99999999999999999999', '-1', '+5', '1.5', '1,5', '1e3', 'abc', '1 0', '٣', ''])(
    'el valor %j es un error: se mantiene el último valor válido y "Guardar" se deshabilita',
    async (text) => {
      await openFor('ES', '51');
      setField('Usuarios', text);
      expect(usersField()).toHaveAttribute('aria-invalid', 'true');
      expect(usersField()).toHaveAccessibleDescription(/.+/);
      expect(total().textContent).toBe(money('514,25 EUR'));
      expect(slider()).toHaveValue('51');
      expect(saveButton()).toHaveAttribute('aria-disabled', 'true');
    },
  );

  it('último válido 51, se escribe "5x" y al corregir a 52 se recalcula', async () => {
    await openFor('ES', '51');
    setField('Usuarios', '5x');
    expect(total().textContent).toBe(money('514,25 EUR'));
    setField('Usuarios', '52');
    expect(total().textContent).toBe(money('520,30 EUR'));
    expect(saveButton()).toBeEnabled();
  });

  it.each(['-1', '1000001', '1.5'])('storage y apiCalls con %j dan error de campo y no se puede guardar', async (text) => {
    await openFor('ES');
    setField('Almacenamiento (GB)', text);
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveAttribute('aria-invalid', 'true');
    expect(saveButton()).toHaveAttribute('aria-disabled', 'true');
    setField('Almacenamiento (GB)', '0');
    setField('Llamadas a la API (al mes)', text);
    expect(screen.getByLabelText('Llamadas a la API (al mes)')).toHaveAttribute('aria-invalid', 'true');
    expect(saveButton()).toHaveAttribute('aria-disabled', 'true');
  });

  it('avisa de que storage y apiCalls no suman al precio (D4)', async () => {
    await openFor('ES');
    expect(screen.getByText('Recursos que no suman al precio')).toBeVisible();
  });
});
