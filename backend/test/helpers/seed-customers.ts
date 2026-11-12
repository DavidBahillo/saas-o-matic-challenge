// Siembra de clientes para los tests de búsqueda y consulta (T9, T11). Inserta con el repositorio
// real y la misma clave de búsqueda que calcula el service, así los ids siguen el orden de
// inserción. El tax ID se valida con shared, de modo que el valor y el `taxIdType` sembrados son
// siempre coherentes (un CIF se siembra como CIF). No hay estado de módulo: el tax ID por defecto
// se deriva del número de filas de la BD de cada TestApp.
import { toSearchKey, validateTaxId } from '@saas-o-matic/shared';
import type { Customer } from '@saas-o-matic/shared';
import { FIXED_NOW } from './test-app';
import type { TestApp } from './test-app';

export interface SeedInput {
  companyName: string;
  taxId?: string;
  country?: string;
}

/** Tax ID genérico de US, solo dígitos para que no coincida con búsquedas por letras. */
function defaultTaxId(t: TestApp): string {
  return `9${String(t.countCustomers() + 1).padStart(8, '0')}`;
}

export function seedCustomer(t: TestApp, input: SeedInput): Customer {
  const country = input.country ?? 'US';
  const taxId = validateTaxId(country, input.taxId ?? defaultTaxId(t));
  if (!taxId.ok) throw new Error(`Tax ID de siembra no válido en ${country}: ${taxId.error.code}`);
  return t.repository.insert({
    companyName: input.companyName,
    companyNameSearch: toSearchKey(input.companyName),
    taxId: taxId.value,
    taxIdType: taxId.taxIdType,
    email: 'compras@example.com',
    country,
    plan: 'starter',
    createdAt: FIXED_NOW,
  });
}

/** Inserta los nombres en orden: el primero recibe el id 1, el segundo el 2… */
export function seedNames(t: TestApp, names: readonly string[]): Customer[] {
  return names.map((companyName) => seedCustomer(t, { companyName }));
}
