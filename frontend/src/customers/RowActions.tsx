// Acciones de fila de la lista de clientes (RF19, RF30): "Editar" lleva a /customers/:id/edit (con la búsqueda y la página
// de origen en el estado de navegación, D-7) y "Borrar" abre el diálogo de confirmación. Los controles van por encima del
// enlace estirado de la fila (z-index de `.btn--icon`), así que el clic no llega a él.
import type { Customer } from '@saas-o-matic/shared';
import { Link, useLocation } from 'react-router';
import { Button } from '../ui/Button';
import { PencilIcon, TrashIcon } from '../ui/icons';

export interface RowActionsProps {
  customer: Customer;
  onDelete: (customer: Customer) => void;
}

export function RowActions({ customer, onDelete }: RowActionsProps) {
  const { pathname, search } = useLocation();
  return (
    <div className="row-actions">
      <Link
        to={`/customers/${String(customer.id)}/edit`}
        state={{ from: pathname + search }}
        className="btn btn--ghost btn--md btn--icon row-action"
        aria-label={`Editar ${customer.companyName}`}
      >
        <PencilIcon />
      </Link>
      <Button
        variant="ghost"
        className="btn--icon row-action row-action--danger"
        aria-label={`Borrar ${customer.companyName}`}
        onClick={() => { onDelete(customer); }}
      >
        <TrashIcon />
      </Button>
    </div>
  );
}
