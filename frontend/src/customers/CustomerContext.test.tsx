// RF14 a RF17 (spec 010): plan junto al nombre, datos con icono, "Presentar" con tooltip Alt+P.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACME } from '../test/fixtures';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { CustomerContext } from './CustomerContext';
import { formatDateOnly } from './format-since';

const long = { ...ACME, companyName: 'X'.repeat(100), email: `${'a'.repeat(60)}@${'b'.repeat(40)}.example.com` };

function setup(onPresent = vi.fn(), customer = ACME) {
  render(<CustomerContext customer={customer} presentation={false} onPresent={onPresent} />);
  return { onPresent, button: screen.getByRole('button', { name: 'Presentar' }) };
}

describe('CustomerContext (spec 010)', () => {
  beforeEach(useFakeClock);
  afterEach(useRealClock);

  it('el plan va junto al h1 en la misma fila', () => {
    setup();
    const h1 = screen.getByRole('heading', { level: 1, name: ACME.companyName });
    expect(h1.parentElement).toHaveClass('customer-context__name');
    expect(within(h1.parentElement as HTMLElement).getByText('growth')).toHaveClass('badge--plan-growth');
  });

  it('cuatro datos con icono aria-hidden: país con bandera, NIF, correo y fecha', () => {
    setup();
    const meta = document.querySelector('.customer-context__meta') as HTMLElement;
    expect(meta.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(4);
    expect(within(meta).getByRole('img', { name: 'España' })).toBeVisible();
    expect(within(meta).getByText(ACME.taxId)).toBeVisible();
    expect(within(meta).getByText(ACME.email)).toBeVisible();
    expect(within(meta).getByText(`Cliente desde ${formatDateOnly(ACME.createdAt)}`)).toBeVisible();
    expect(within(meta).queryByText('growth')).toBeNull();
  });

  it('"Presentar" declara Alt+P y lanza onPresent', () => {
    const { button, onPresent } = setup();
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+P');
    expect(button).toHaveAttribute('data-presentation-toggle');
    fireEvent.click(button);
    expect(onPresent).toHaveBeenCalledOnce();
  });

  it('el tooltip "Alt+P" sale con el ratón y con el foco, y Escape lo cierra', () => {
    const { button } = setup();
    fireEvent.mouseEnter(button.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(150));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Alt+P');
    expect(button).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
    fireEvent.mouseLeave(button.parentElement as HTMLElement);
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => { button.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Alt+P');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('nombre largo sin espacios y correo largo: el contenedor permite el salto', () => {
    setup(vi.fn(), long);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('X'.repeat(100));
    expect(screen.getByText(long.email)).toHaveAttribute('translate', 'no');
  });

  it('sin símbolos de divisa en la línea de contexto (punto 21)', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Datos del cliente' }).textContent).not.toMatch(/[€$£¥]/);
  });
});
