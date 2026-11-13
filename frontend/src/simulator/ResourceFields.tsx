// Almacenamiento y llamadas a la API (RF22): se guardan pero no suman al precio (D4).
import { Field } from '../ui/Field';
import type { CountField } from './use-count-field';

interface Props {
  storage: CountField;
  apiCalls: CountField;
  storageErrors?: readonly string[];
  apiCallsErrors?: readonly string[];
}

function Numeric({ label, field, extra = [] }: { label: string; field: CountField; extra?: readonly string[] }) {
  const errors = [...(field.error === undefined ? [] : [field.error]), ...extra];
  return (
    <Field label={label} errors={errors}>
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
  );
}

export function ResourceFields({ storage, apiCalls, storageErrors, apiCallsErrors }: Props) {
  return (
    <div className="resources">
      <Numeric label="Almacenamiento (GB)" field={storage} extra={storageErrors ?? []} />
      <Numeric label="Llamadas a la API (al mes)" field={apiCalls} extra={apiCallsErrors ?? []} />
      <p className="muted resources__note">El almacenamiento y las llamadas a la API no suman al precio.</p>
    </div>
  );
}
