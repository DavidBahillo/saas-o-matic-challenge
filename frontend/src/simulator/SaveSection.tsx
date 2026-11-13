// Zona de guardado del simulador (RF25 a RF27): botón, errores, avisos y presupuesto guardado.
import type { Currency } from '@saas-o-matic/shared';
import { SavedQuote } from '../customers/SavedQuote';
import { Button } from '../ui/Button';
import { RateDifference, SaveNotices } from './SaveNotices';
import type { SimulatorSave } from './use-simulator-save';

export function SaveSection({ currency, blocked, state }: { currency: Currency; blocked: boolean; state: SimulatorSave }) {
  const { pending, view, saved, save, saveInEur, retry } = state;
  return (
    <>
      <div className="simulator__save">
        <p className="muted">Divisa de la simulación: {currency}</p>
        {view?.byControl.currency !== undefined && <p className="field__error">{view.byControl.currency.join(' ')}</p>}
        <Button variant="primary" disabled={blocked || pending} onClick={save}>
          {pending ? 'Guardando…' : 'Guardar simulación'}
        </Button>
      </div>
      {view !== undefined && <SaveNotices view={view} onRetry={retry} onSaveInEur={saveInEur} />}
      {saved !== undefined && (
        <div className="simulator__saved">
          <h3>Presupuesto guardado</h3>
          <RateDifference applied={saved.simulation.exchangeRate} preview={saved.previewRate} />
          <SavedQuote simulation={saved.simulation} testId="saved-quote" />
        </div>
      )}
    </>
  );
}
