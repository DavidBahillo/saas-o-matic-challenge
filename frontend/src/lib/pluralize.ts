// Plurales en español con Intl.PluralRules (RF58). Única excepción autorizada a la regla de no tocar `lib/` en la 008.
const rules = new Intl.PluralRules('es');

export function pluralize(count: number, one: string, other: string): string {
  return rules.select(count) === 'one' ? one : other;
}

export function simulationsLabel(count: number): string {
  return `${String(count)} ${pluralize(count, 'simulación', 'simulaciones')}`;
}

export function usersLabel(count: number): string {
  return `${String(count)} ${pluralize(count, 'usuario', 'usuarios')}`;
}

export function customersLabel(count: number): string {
  return `${String(count)} ${pluralize(count, 'cliente', 'clientes')}`;
}
