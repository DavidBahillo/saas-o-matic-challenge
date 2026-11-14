// RF7, RF10: el mismo formulario sirve al alta (valores por defecto) y a la edición (initialValues y etiquetas propias).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CustomerForm } from './CustomerForm';

const VALUES = { companyName: 'Acme SL', country: 'PT', taxId: '123456789', email: 'a@b.pt', plan: 'enterprise' };

function setup(props: Partial<Parameters<typeof CustomerForm>[0]> = {}) {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <CustomerForm pending={false} error={null} onSubmit={onSubmit} {...props} />
    </MemoryRouter>,
  );
  return onSubmit;
}

describe('CustomerForm', () => {
  it('sin initialValues arranca vacío con los textos del alta y sin "Cancelar"', () => {
    setup();
    expect(screen.getByLabelText('Empresa')).toHaveValue('');
    expect(screen.getByLabelText('País')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Cancelar' })).toBeNull();
  });

  it('con initialValues muestra los cinco campos rellenos y envía lo mismo sin tocar nada', async () => {
    const onSubmit = setup({ initialValues: VALUES, submitLabel: 'Guardar cambios', cancelTo: '/?page=2' });
    expect(screen.getByLabelText('Identificador fiscal')).toHaveValue('123456789');
    expect(screen.getByLabelText('Plan')).toHaveValue('enterprise');
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/?page=2');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(VALUES);
  });

  it('pendingLabel sustituye al texto del botón mientras envía', () => {
    setup({ pending: true, pendingLabel: 'Guardando…', submitLabel: 'Guardar cambios' });
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });
});
