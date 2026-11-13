// Controles del alta (RF10): empresa, país, identificador fiscal, email y plan, con su error junto a cada uno.
import { ISO_3166_ALPHA2, PLANS } from '@saas-o-matic/shared';
import type { NewCustomerValues } from '../api/customers.mutations';
import { Field } from '../ui/Field';
import type { FormControl } from './customer-form-errors';

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

export function CustomerFields({ values, errors, onChange }: CustomerFieldsProps) {
  const text = (key: keyof NewCustomerValues) => (event: { target: { value: string } }) => {
    onChange(key, event.target.value);
  };
  return (
    <>
      <Field label="Empresa" errors={errors.companyName ?? []}>
        {(c) => <input {...c} className="input" value={values.companyName} onChange={text('companyName')} />}
      </Field>
      <Field label="País" errors={errors.country ?? []}>
        {(c) => (
          <select {...c} className="input" value={values.country} onChange={text('country')}>
            <CountryOptions />
          </select>
        )}
      </Field>
      <Field label="Identificador fiscal" errors={errors.taxId ?? []}>
        {(c) => <input {...c} className="input" value={values.taxId} onChange={text('taxId')} />}
      </Field>
      <Field label="Email" errors={errors.email ?? []}>
        {(c) => <input {...c} className="input" value={values.email} onChange={text('email')} />}
      </Field>
      <Field label="Plan" errors={errors.plan ?? []}>
        {(c) => (
          <select {...c} className="input" value={values.plan} onChange={text('plan')}>
            {PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        )}
      </Field>
    </>
  );
}
