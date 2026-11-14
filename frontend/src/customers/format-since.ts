// Fecha sin hora para "Alta" y "Cliente desde" (P12), en la hora local del navegador.
const DATE_ONLY = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDateOnly(iso: string): string {
  return DATE_ONLY.format(new Date(iso));
}
