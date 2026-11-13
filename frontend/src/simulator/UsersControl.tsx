// Control de usuarios (RF20): campo numérico de 0 a 100 000 enlazado con un slider nativo de 0 a 100.
import { Field } from '../ui/Field';
import type { CountField } from './use-count-field';

export const SLIDER_MAX = 100;

export function UsersControl({ field, serverErrors = [] }: { field: CountField; serverErrors?: readonly string[] }) {
  const errors = [...(field.error === undefined ? [] : [field.error]), ...serverErrors];
  return (
    <div className="users-control">
      <Field label="Usuarios" errors={errors}>
        {(control) => (
          <input
            {...control}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="input"
            value={field.text}
            onChange={(e) => { field.onChange(e.target.value); }}
          />
        )}
      </Field>
      <div className="slider">
        <input
          type="range"
          aria-label="Usuarios (control deslizante)"
          min={0}
          max={SLIDER_MAX}
          step={1}
          value={Math.min(field.value, SLIDER_MAX)}
          onChange={(e) => { field.onChange(e.target.value); }}
        />
        <div className="slider__marks" data-testid="slider-marks" aria-hidden="true">
          <span style={{ left: '10%' }}>10</span>
          <span style={{ left: '50%' }}>50</span>
        </div>
      </div>
    </div>
  );
}
