// Divisa activa y vista previa convertida (RF23): tabla "Divisa activa y vista previa convertida" de la spec.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, setField, total, ratesReady, waitForSimulator } from '../test/detail';
import { ACME } from '../test/fixtures';

const NBSP = String.fromCharCode(0xa0);
const money = (text: string) => text.replace(' ', NBSP);

describe('Simulador: divisa y vista previa convertida (RF23)', () => {
  async function withCurrency(currency: 'USD' | 'GBP', users: string) {
    const view = renderDetail({ customer: ACME });
    await waitForSimulator();
    await ratesReady();
    setField('Usuarios', users);
    await view.user.selectOptions(screen.getByRole('combobox', { name: 'Divisa' }), currency);
    return view;
  }

  it('EUR: sin vista previa convertida', async () => {
    renderDetail({ customer: ACME });
    await waitForSimulator();
    setField('Usuarios', '15');
    expect(screen.queryByText('Vista previa')).toBeNull();
  });

  it('USD con tipo 1,10: 154,00 + 32,34 = 186,34 USD con "Vista previa" y el tipo', async () => {
    await withCurrency('USD', '15');
    const preview = screen.getByTestId('converted-preview');
    expect(within(preview).getByText('Vista previa')).toBeVisible();
    expect(within(preview).getByText('154,00 USD')).toBeVisible();
    expect(within(preview).getByText('32,34 USD')).toBeVisible();
    expect(within(preview).getByText('186,34 USD')).toBeVisible();
    expect(within(preview).getByText(/Tipo 1,10/)).toBeVisible();
  });

  it('GBP con tipo 0,85: 119,00 + 24,99 = 143,99 GBP', async () => {
    await withCurrency('GBP', '15');
    const preview = screen.getByTestId('converted-preview');
    expect(within(preview).getByText('119,00 GBP')).toBeVisible();
    expect(within(preview).getByText('24,99 GBP')).toBeVisible();
    expect(within(preview).getByText('143,99 GBP')).toBeVisible();
  });

  it('51 usuarios en USD: IVA convertido 98,18 y total 565,68', async () => {
    await withCurrency('USD', '51');
    const preview = screen.getByTestId('converted-preview');
    expect(within(preview).getByText('98,18 USD')).toBeVisible();
    expect(within(preview).getByText('565,68 USD')).toBeVisible();
  });

  it('el total en euros sigue visible junto a la vista previa', async () => {
    await withCurrency('USD', '15');
    expect(total().textContent).toBe(money('169,40 EUR'));
  });
});
