// Almacenamiento y llamadas a la API (RF27): se guardan pero no suman al precio (D4); el <details> se abre con un error.
import { useState } from 'react';
import { Field } from '../ui/Field';
import type { CountField } from './use-count-field';

interface Props {
  storage: CountField;
  apiCalls: CountField;
  storageErrors?: readonly string[];
  apiCallsErrors?: readonly string[];
}

function Numeric({ label, name, field, extra = [] }: { label: string; name: string; field: CountField; extra?: readonly string[] }) {
  const errors = [...(field.error === undefined ? [] : [field.error]), ...extra];
  return (
    <Field label={label} errors={errors}>
      {(control) => (
        <input
          {...control}
          type="text"
          name={name}
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

export function ResourceFields({ storage, apiCalls, storageErrors = [], apiCallsErrors = [] }: Props) {
  const [open, setOpen] = useState(true);
  const hasError = [storage.error, apiCalls.error].some((e) => e !== undefined) || storageErrors.length + apiCallsErrors.length > 0;
  return (
    <details
      className="resources"
      open={open || hasError}
      onToggle={(e) => { setOpen(e.currentTarget.open); }}
    >
      <summary>Recursos que no suman al precio</summary>
      <div className="resources__fields">
        <Numeric label="Almacenamiento (GB)" name="storageGb" field={storage} extra={storageErrors} />
        <Numeric label="Llamadas a la API (al mes)" name="apiCalls" field={apiCalls} extra={apiCallsErrors} />
      </div>
    </details>
  );
}
