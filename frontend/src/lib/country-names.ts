// Nombre de un país en español (RF19). Si el navegador no lo conoce, el propio código.
const NAMES = new Intl.DisplayNames('es', { type: 'region' });

export function countryName(code: string): string {
  try {
    return NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}
