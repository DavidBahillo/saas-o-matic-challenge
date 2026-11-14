// RF64 a RF66: botones "Editar" y "Borrar" de la lista de clientes, deshabilitados con aria-disabled y con tooltip "Próximamente".
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { RowActions } from './RowActions';

function setup() {
  render(
    <MemoryRouter>
      <RowActions company="Panadería Los Álamos" />
    </MemoryRouter>,
  );
  return {
    edit: screen.getByRole('button', { name: 'Editar Panadería Los Álamos' }),
    remove: screen.getByRole('button', { name: 'Borrar Panadería Los Álamos' }),
  };
}

describe('RowActions', () => {
  beforeEach(useFakeClock);
  afterEach(useRealClock);

  it('dos botones con la empresa en el nombre, aria-disabled y sin disabled', () => {
    const { edit, remove } = setup();
    for (const button of [edit, remove]) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('type', 'button');
    }
  });

  it('los iconos van ocultos a lectores y el de borrar lleva la clase destructiva suave', () => {
    const { edit, remove } = setup();
    expect(edit.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(remove.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(remove).toHaveClass('row-action--danger');
    expect(edit).not.toHaveClass('row-action--danger');
    expect(edit).toHaveClass('btn--icon');
  });

  it('reciben foco con Tab y el aviso "Próximamente" aparece a los 150 ms, enlazado con aria-describedby', () => {
    const { edit } = setup();
    act(() => { edit.focus(); });
    expect(edit).toHaveFocus();
    act(() => void vi.advanceTimersByTime(150));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Próximamente');
    expect(edit).toHaveAttribute('aria-describedby', tip.id);
  });

  it('el aviso también sale con el ratón y al tocar', () => {
    const { remove } = setup();
    fireEvent.mouseEnter(remove.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(150));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Próximamente');
    fireEvent.mouseLeave(remove.parentElement as HTMLElement);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(remove);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Próximamente');
  });

  it('pulsar no ejecuta ninguna acción (se cancela el clic) y no hay enlaces dentro de los botones', () => {
    const { edit, remove } = setup();
    expect(fireEvent.click(edit)).toBe(false);
    expect(fireEvent.click(remove)).toBe(false);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
