// Acciones de fila de la lista de clientes (RF64 a RF66): "Editar" y "Borrar", sin función todavía.
// Decisión: aria-disabled="true" y no `disabled` nativo, porque un botón con `disabled` no recibe foco ni anuncia su motivo;
// así conservan el foco, el Tooltip "Próximamente" funciona con teclado y al tocar, y el motivo se anuncia con aria-describedby.
// La pulsación se cancela (no hace nada). Los botones van por encima del enlace estirado de la fila (z-index), así que el
// clic no llega a él; no se detiene la propagación para que el Tooltip pueda alternarse al tocar.
import type { MouseEvent, ReactNode } from 'react';
import { Button } from '../ui/Button';
import { PencilIcon, TrashIcon } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';

const SOON = 'Próximamente';

function ignore(event: MouseEvent): void {
  event.preventDefault();
}

interface ActionProps {
  label: string;
  danger?: boolean;
  children: ReactNode;
}

function Action({ label, danger = false, children }: ActionProps) {
  return (
    <Tooltip text={SOON} toggle>
      <Button
        variant="ghost"
        className={danger ? 'btn--icon row-action row-action--danger' : 'btn--icon row-action'}
        aria-label={label}
        aria-disabled="true"
        onClick={ignore}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export function RowActions({ company }: { company: string }) {
  return (
    <div className="row-actions">
      <Action label={`Editar ${company}`}>
        <PencilIcon />
      </Action>
      <Action label={`Borrar ${company}`} danger>
        <TrashIcon />
      </Action>
    </div>
  );
}
