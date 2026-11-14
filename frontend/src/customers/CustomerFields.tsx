// Controles del alta (RF10, RF30): grupos "Empresa" y "Contacto y plan", con su error junto a cada control.
import { ISO_3166_ALPHA2, PLANS } from '@saas-o-matic/shared';
import type { NewCustomerValues } from '../api/customers.mutations';
import { Field } from '../ui/Field';
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

interface GroupProps {
  values: NewCustomerValues;
  errors: CustomerFieldsProps['errors'];
  text: TextChange;
}

function CompanyGroup({ values, errors, text }: GroupProps) {
  return (
    <fieldset className="form__group">
      <legend>Empresa</legend>
      <Field label="Empresa" errors={errors.companyName ?? []}>
        {(c) => <input {...c} name="companyName" autoComplete="organization" className="input" value={values.companyName} onChange={text('companyName')} />}
      </Field>
      <Field label="País" errors={errors.country ?? []}>
        {(c) => (
          <select {...c} name="country" autoComplete="country" className="input" value={values.country} onChange={text('country')}>
            <CountryOptions />
          </select>
        )}
      </Field>
      <Field label="Identificador fiscal" errors={errors.taxId ?? []}>
        {(c) => <input {...c} name="taxId" autoComplete="off" spellCheck={false} placeholder="Ej.: 12345678Z…" className="input" value={values.taxId} onChange={text('taxId')} />}
      </Field>
    </fieldset>
  );
}

function ContactGroup({ values, errors, text }: GroupProps) {
  return (
    <fieldset className="form__group">
      <legend>Contacto y plan</legend>
      <Field label="Email" errors={errors.email ?? []}>
        {(c) => <input {...c} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="nombre@empresa.com…" className="input" value={values.email} onChange={text('email')} />}
      </Field>
      <Field label="Plan" errors={errors.plan ?? []}>
        {(c) => (
          <select {...c} name="plan" autoComplete="off" className="input" value={values.plan} onChange={text('plan')}>
            {PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {planLabel(plan)}
              </option>
            ))}
          </select>
        )}
      </Field>
    </fieldset>
  );
}

export function CustomerFields({ values, errors, onChange }: CustomerFieldsProps) {
  const text: TextChange = (key) => (event) => {
    onChange(key, event.target.value);
  };
  return (
    <>
      <CompanyGroup values={values} errors={errors} text={text} />
      <ContactGroup values={values} errors={errors} text={text} />
    </>
  );
}
