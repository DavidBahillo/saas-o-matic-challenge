// Atribución exigida por el proveedor de tipos (RF12).
export const RATES_ATTRIBUTION_URL = 'https://www.exchangerate-api.com';

export function RatesAttribution() {
  return (
    <a className="attribution" href={RATES_ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
      Tipos de cambio por ExchangeRate-API
    </a>
  );
}
