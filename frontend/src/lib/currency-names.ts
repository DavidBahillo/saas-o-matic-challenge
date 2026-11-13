// Nombre de una divisa en español (RF9). Si el navegador no la conoce, el propio código.
const NAMES = new Intl.DisplayNames('es', { type: 'currency' });

export function currencyName(code: string): string {
  try {
    return NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}
