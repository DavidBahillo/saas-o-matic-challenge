// RF19 a RF22, RF25, RF26, RF30: diálogo de borrado con <dialog> nativo.
import type { Customer } from '@saas-o-matic/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../api/query-client';
import { apiError, deferred, makeCustomer } from '../test/fixtures';
import { mockFetch } from '../test/mock-fetch';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import type { DeleteOutcome } from '../api/customers.mutations';

function setup(customer: Customer, routes: Parameters<typeof mockFetch>[0] = {}) {
  const fetchMock = mockFetch(routes);
  const onClose = vi.fn();
  const onDeleted = vi.fn<(outcome: DeleteOutcome) => void>();
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={createQueryClient()}>
      <DeleteCustomerDialog customer={customer} onClose={onClose} onDeleted={onDeleted} />
    </QueryClientProvider>,
  );
  return { fetchMock, onClose, onDeleted, user };
}

const dialog = () => screen.getByRole('dialog');
const confirm = () => screen.getByRole('button', { name: 'Borrar' });

describe('DeleteCustomerDialog', () => {
  it('muestra el nombre, las simulaciones de la fila y deja el foco en "Cancelar"', () => {
    setup(makeCustomer({ id: 7, companyName: 'Acme SL', simulationCount: 14 }));
    expect(dialog()).toHaveAccessibleName('¿Borrar «Acme SL»?');
    expect(dialog()).toHaveTextContent('Se borrarán también 14 simulaciones');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('con 0 simulaciones dice "No tiene simulaciones" y con 1 usa el singular', () => {
    setup(makeCustomer({ simulationCount: 0 }));
    expect(dialog()).toHaveTextContent('No tiene simulaciones');
  });

  it('con 1 simulación usa el singular', () => {
    setup(makeCustomer({ simulationCount: 1 }));
    expect(dialog()).toHaveTextContent('Se borrarán también 1 simulación');
  });

  it('"Cancelar", Escape y el clic fuera cierran sin llamar a DELETE', async () => {
    const { user, onClose, fetchMock } = setup(makeCustomer({}));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent(dialog(), new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(dialog());
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(fetchMock.calls).toHaveLength(0);
  });

  it('un clic dentro del contenido no cierra', async () => {
    const { user, onClose } = setup(makeCustomer({}));
    await user.click(screen.getByRole('heading'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('al confirmar llama a DELETE y entrega el deletedSimulations real', async () => {
    const { user, onDeleted, fetchMock } = setup(makeCustomer({ id: 7, simulationCount: 2 }), {
      'DELETE /api/customers/7': { body: { deletedSimulations: 3 } },
    });
    await user.click(confirm());
    await waitFor(() => { expect(onDeleted).toHaveBeenCalledTimes(1); });
    expect(onDeleted.mock.calls[0]?.[0]).toEqual({ deletedSimulations: 3, alreadyGone: false });
    expect(fetchMock.callsTo('DELETE /api/customers/7')).toHaveLength(1);
  });

  it('un 404 se trata como éxito', async () => {
    const { user, onDeleted } = setup(makeCustomer({ id: 7 }), {
      'DELETE /api/customers/7': apiError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.'),
    });
    await user.click(confirm());
    await waitFor(() => { expect(onDeleted).toHaveBeenCalledTimes(1); });
    expect(onDeleted.mock.calls[0]?.[0]).toEqual({ deletedSimulations: 0, alreadyGone: true });
  });

  it('un fallo muestra el error con "Reintentar", que repite el borrado', async () => {
    let calls = 0;
    const { user, onDeleted, fetchMock } = setup(makeCustomer({ id: 7 }), {
      'DELETE /api/customers/7': () => (++calls === 1 ? apiError(500, 'INTERNAL_ERROR', 'Fallo interno.') : { body: { deletedSimulations: 0 } }),
    });
    await user.click(confirm());
    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo interno.');
    expect(onDeleted).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => { expect(onDeleted).toHaveBeenCalledTimes(1); });
    expect(fetchMock.callsTo('DELETE /api/customers/7')).toHaveLength(2);
  });

  it('no admite doble confirmación mientras la petición está en curso', async () => {
    const gate = deferred<{ body: unknown }>();
    const { user, fetchMock } = setup(makeCustomer({ id: 7 }), { 'DELETE /api/customers/7': () => gate.promise });
    await user.dblClick(confirm());
    expect(fetchMock.callsTo('DELETE /api/customers/7')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Borrando…' })).toBeDisabled();
    gate.resolve({ body: { deletedSimulations: 0 } });
  });
});
