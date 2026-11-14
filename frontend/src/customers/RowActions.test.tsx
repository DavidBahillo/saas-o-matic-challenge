// RF19, RF30: "Editar" es un enlace activo a /customers/:id/edit y "Borrar" abre el diálogo; ya no hay "Próximamente".
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { makeCustomer } from '../test/fixtures';
import { RowActions } from './RowActions';

const CUSTOMER = makeCustomer({ id: 12, companyName: 'Panadería Los Álamos' });

function setup(onDelete = vi.fn(), entry = '/?q=pan&page=2') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <RowActions customer={CUSTOMER} onDelete={onDelete} />
    </MemoryRouter>,
  );
  return {
    edit: screen.getByRole('link', { name: 'Editar Panadería Los Álamos' }),
    remove: screen.getByRole('button', { name: 'Borrar Panadería Los Álamos' }),
    onDelete,
  };
}

describe('RowActions', () => {
  it('"Editar" es un enlace a /customers/:id/edit con el nombre accesible de la empresa', () => {
    const { edit } = setup();
    expect(edit).toHaveAttribute('href', '/customers/12/edit');
    expect(edit).not.toHaveAttribute('aria-disabled');
  });

  it('"Borrar" es un botón activo que llama a onDelete con el cliente', () => {
    const { remove, onDelete } = setup();
    expect(remove).not.toHaveAttribute('aria-disabled');
    expect(remove).toHaveAttribute('type', 'button');
    fireEvent.click(remove);
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(CUSTOMER);
  });

  it('los iconos van ocultos a lectores y el de borrar lleva la clase destructiva suave', () => {
    const { edit, remove } = setup();
    expect(edit.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(remove.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(remove).toHaveClass('row-action--danger');
    expect(edit).toHaveClass('btn--icon');
  });

  it('ya no queda ningún "Próximamente"', () => {
    setup();
    expect(screen.queryByText('Próximamente')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
