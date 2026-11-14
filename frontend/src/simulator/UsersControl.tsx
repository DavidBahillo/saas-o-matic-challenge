// Configuración de usuarios (RF23): cifra grande, escalera de tramos sobre el slider con marcas y explicación del cálculo.
import type { Quote } from '@saas-o-matic/shared';
import type { CSSProperties } from 'react';
import { usersLabel } from '../lib/pluralize';
import { Field } from '../ui/Field';
import { explainTiers } from './explain-model';
import { buildLadder } from './ladder-model';
import { TierLadder } from './TierLadder';
import type { CountField } from './use-count-field';

export const SLIDER_MAX = 100;

interface Props {
  field: CountField;
  serverErrors?: readonly string[];
  /** Desglose actual; sin él (cálculo no válido) no hay escalera ni explicación. */
  tiers: Quote['tiers'] | undefined;
  /** En presentación solo quedan cifra, escalera y slider. */
  presentation?: boolean;
}

const SLIDER_NOTE_ID = 'users-slider-note';

/** RF54: valuetext con el número real; con más usuarios que el máximo del control, nota visible enlazada. */
function UsersSlider({ value, onChange }: { value: number; onChange: (text: string) => void }) {
  const sliderValue = Math.min(value, SLIDER_MAX);
  const beyond = value > SLIDER_MAX;
  const style = { '--pos': `${String((sliderValue * 100) / SLIDER_MAX)}%` } as CSSProperties;
  return (
    <>
    <div className="slider" style={style}>
      <input
        type="range"
        name="usersSlider"
        autoComplete="off"
        aria-label="Usuarios (control deslizante)"
        aria-valuetext={beyond ? `${usersLabel(value)} (el control llega a ${String(SLIDER_MAX)})` : usersLabel(value)}
        aria-describedby={beyond ? SLIDER_NOTE_ID : undefined}
        min={0}
        max={SLIDER_MAX}
        step={1}
        value={sliderValue}
        onChange={(e) => { onChange(e.target.value); }}
      />
      <div className="slider__marks" data-testid="slider-marks" aria-hidden="true">
        <span style={{ left: '10%' }}>10</span>
        <span style={{ left: '50%' }}>50</span>
      </div>
    </div>
    {beyond && (
      <p id={SLIDER_NOTE_ID} className="muted users-control__note">
        El control llega a {String(SLIDER_MAX)}; escribe más en el campo
      </p>
    )}
    </>
  );
}

export function UsersControl({ field, serverErrors = [], tiers, presentation = false }: Props) {
  const errors = [...(field.error === undefined ? [] : [field.error]), ...serverErrors];
  const steps = tiers === undefined ? [] : buildLadder(tiers);
  return (
    <div className="users-control">
      <h2 className="users-control__title">¿Cuántos usuarios?</h2>
      <div className="users-control__figure">
        <Field label="Usuarios" errors={errors} hideLabel>
          {(control) => (
            <input
              {...control}
              type="text"
              name="users"
              inputMode="numeric"
              autoComplete="off"
              className="input users-control__input"
              value={field.text}
              onChange={(e) => { field.onChange(e.target.value); }}
            />
          )}
        </Field>
        <span className="muted" aria-hidden="true">usuarios</span>
      </div>
      <div className="users-scale">
        <p className="label muted">Precio por usuario, en EUR</p>
        {steps.length > 0 && <TierLadder steps={steps} presentation={presentation} />}
        <UsersSlider value={field.value} onChange={field.onChange} />
      </div>
      {!presentation && tiers !== undefined && (
        <p className="muted users-control__explain">
          {`Cada tramo cobra solo los usuarios que caen en él. ${explainTiers(tiers, field.value)}`}
        </p>
      )}
    </div>
  );
}
