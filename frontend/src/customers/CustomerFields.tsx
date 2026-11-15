// Controles del alta (RF10, RF30; spec 010 RF22, RF23): cinco campos sin grupos; País y Plan en la misma fila, con su error junto a cada control.
import { ISO_3166_ALPHA2, PLANS } from '@saas-o-matic/shared';
import type { NewCustomerValues } from '../api/customers.mutations';
import { Field } from '../ui/Field';
import { SelectShell } from '../ui/SelectShell';
import type { FormControl } from './customer-form-errors';

/** El valor enviado no cambia (starter); se muestra capitalizado (Starter). */
const planLabel = (plan: string): string => plan.charAt(0).toUpperCase() + plan.slice(1);

const regionNames = new Intl.DisplayNames('es', { type: 'region' });

function countryLabel(code: string): string {
  try {
    return `${regionNames.of(code) ?? code} (${code})`;
  } catch {
    return code;
  }
}

export interface CustomerFieldsProps {
  values: NewCustomerValues;
  errors: Partial<Record<FormControl, string[]>>;
  onChange: (key: keyof NewCustomerValues, value: string) => void;
}

function CountryOptions() {
  return (
    <>
      <option value="">Selecciona un país</option>
      {ISO_3166_ALPHA2.map((code) => (
        <option key={code} value={code}>
          {countryLabel(code)}
        </option>
      ))}
    </>
  );
}

type TextChange = (key: keyof NewCustomerValues) => (event: { target: { value: string } }) => void;

export function CustomerFields({ values, errors, onChange }: CustomerFieldsProps) {
  const text: TextChange = (key) => (event) => {
    onChange(key, event.target.value);
  };
  return (
    <>
      <Field label="Empresa" errors={errors.companyName ?? []}>
        {(c) => <input {...c} name="companyName" autoComplete="organization" className="input" value={values.companyName} onChange={text('companyName')} />}
      </Field>
      <div className="form-row">
        <Field label="País" errors={errors.country ?? []}>
          {(c) => (
            <SelectShell>
              <select {...c} name="country" autoComplete="country" className="input" value={values.country} onChange={text('country')}>
                <CountryOptions />
              </select>
            </SelectShell>
          )}
        </Field>
        <Field label="Plan" errors={errors.plan ?? []}>
          {(c) => (
            <SelectShell>
              <select {...c} name="plan" autoComplete="off" className="input" value={values.plan} onChange={text('plan')}>
                {PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {planLabel(plan)}
                  </option>
                ))}
              </select>
            </SelectShell>
          )}
        </Field>
      </div>
      <Field label="Identificador fiscal" errors={errors.taxId ?? []}>
        {(c) => <input {...c} name="taxId" autoComplete="off" spellCheck={false} placeholder="Ej.: 12345678Z…" className="input" value={values.taxId} onChange={text('taxId')} />}
      </Field>
      <Field label="Email" errors={errors.email ?? []}>
        {(c) => <input {...c} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="nombre@empresa.com…" className="input" value={values.email} onChange={text('email')} />}
      </Field>
    </>
  );
}
