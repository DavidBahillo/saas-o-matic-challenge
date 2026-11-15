// Zona de guardado (RF25 a RF27, RF28): el pie con el botón va dentro de la hoja; avisos y presupuesto guardado, debajo.
// Se anuncian en regiones estables: el error de divisa, y solo "Presupuesto guardado" (con la diferencia de tipo), no la tabla (RF53).
// Con la validación bloqueada el botón usa aria-disabled (conserva el foco y apunta a su explicación) e ignora la pulsación.
import type { Currency } from '@saas-o-matic/shared';
import { useState } from 'react';
import { SavedQuote } from '../customers/SavedQuote';
import { SaveButton } from '../ui/SaveButton';
import { RateDifference, SaveNotices } from './SaveNotices';
import type { SimulatorSave } from './use-simulator-save';

const BLOCKED_ID = 'save-blocked-reason';
const BLOCKED_MESSAGE = 'Corrige los campos marcados para guardar la simulación.';

interface FooterProps { currency: Currency; blocked: boolean; state: SimulatorSave }

export function SaveFooter({ currency, blocked, state }: FooterProps) {
  const { pending, view, save } = state;
  const [attempted, setAttempted] = useState(false);
  const press = (): void => {
    setAttempted(blocked);
    if (!blocked) save();
  };
  return (
    <div className="sheet__foot">
      <div>
        <p className="muted">Divisa de la simulación: <span translate="no">{currency}</span></p>
        <div aria-live="polite" className="simulator__feedback">
          {view?.byControl.currency !== undefined && <p className="field__error">{view.byControl.currency.join(' ')}</p>}
          {attempted && blocked && <p className="field__error">{BLOCKED_MESSAGE}</p>}
        </div>
      </div>
      <SaveButton
        pending={pending}
        ariaLabel="Guardar simulación"
        aria-disabled={blocked || undefined}
        aria-describedby={blocked ? BLOCKED_ID : undefined}
        onClick={press}
      />
      {blocked && (
        <span id={BLOCKED_ID} className="sr-only">
          {BLOCKED_MESSAGE}
        </span>
      )}
    </div>
  );
}

export function SaveFeedback({ state }: { state: SimulatorSave }) {
  const { view, saved, retry, saveInEur } = state;
  return (
    <>
      {view !== undefined && <SaveNotices view={view} onRetry={retry} onSaveInEur={saveInEur} />}
      <div role="status" className="simulator__feedback">
        {saved !== undefined && (
          <>
            <h3>Presupuesto guardado</h3>
            <RateDifference applied={saved.simulation.exchangeRate} preview={saved.previewRate} />
          </>
        )}
      </div>
      {saved !== undefined && (
        <div className="simulator__saved">
          <SavedQuote simulation={saved.simulation} testId="saved-quote" />
        </div>
      )}
    </>
  );
}
