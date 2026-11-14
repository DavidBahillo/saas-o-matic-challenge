// Diálogo de borrado (RF19 a RF22, RF25, RF26, RF30): <dialog> nativo con showModal() (foco atrapado, Escape y fondo inerte
// nativos). Foco inicial en "Cancelar"; al cancelar el foco vuelve al botón que lo abrió. El número de simulaciones es el de
// la fila; el aviso final lo da el `deletedSimulations` real (D-9).
import type { Customer } from '@saas-o-matic/shared';
import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, SyntheticEvent } from 'react';
import { useDeleteCustomer } from '../api/customers.mutations';
import type { DeleteOutcome } from '../api/customers.mutations';
import { generalMessage } from '../api/errors';
import { simulationsLabel } from '../lib/pluralize';
import { useSubmitLock } from '../lib/use-submit-lock';
import { Button } from '../ui/Button';

export interface DeleteCustomerDialogProps {
  customer: Customer;
  onClose: () => void;
  onDeleted: (outcome: DeleteOutcome) => void;
}

function consequence(count: number): string {
  return count === 0 ? 'No tiene simulaciones.' : `Se borrarán también ${simulationsLabel(count)}.`;
}

function DialogActions(props: {
  mutation: Pick<ReturnType<typeof useDeleteCustomer>, 'isPending' | 'isError'>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { mutation, onCancel, onConfirm } = props;
  return (
    <div className="dialog__actions">
      <Button onClick={onCancel} disabled={mutation.isPending} data-initial-focus>
        Cancelar
      </Button>
      <Button variant="destructive" onClick={onConfirm} disabled={mutation.isPending}>
        {mutation.isPending ? 'Borrando…' : mutation.isError ? 'Reintentar' : 'Borrar'}
      </Button>
    </div>
  );
}

export function DeleteCustomerDialog({ customer, onClose, onDeleted }: DeleteCustomerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [opener] = useState(() => document.activeElement);
  const titleId = useId();
  const mutation = useDeleteCustomer();
  const guard = useSubmitLock(mutation.isPending, mutation.data, mutation.error);

  useEffect(() => {
    dialogRef.current?.showModal();
    dialogRef.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
  }, []);

  const cancel = () => {
    onClose();
    if (opener instanceof HTMLElement) opener.focus();
  };
  const handleCancelEvent = (event: SyntheticEvent) => {
    event.preventDefault();
    cancel();
  };
  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) cancel();
  };
  const confirm = () => {
    guard(() => { mutation.mutate(customer.id, { onSuccess: onDeleted }); });
  };

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby={titleId} onCancel={handleCancelEvent} onClick={handleBackdrop}>
      <div className="dialog__body">
        <h2 id={titleId} className="dialog__title">{`¿Borrar «${customer.companyName}»?`}</h2>
        <p>{consequence(customer.simulationCount)}</p>
        <p className="muted">Esta acción no se puede deshacer.</p>
        {mutation.isError && <p className="dialog__error" role="alert">{generalMessage(mutation.error)}</p>}
        <DialogActions mutation={mutation} onCancel={cancel} onConfirm={confirm} />
      </div>
    </dialog>
  );
}
