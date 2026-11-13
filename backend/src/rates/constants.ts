// Constantes con nombre de la caché y del proveedor de tipos de cambio (RF15, RF16; U7 y V1).

/** Un tipo es vigente mientras tenga menos de 24 horas (RF15). */
export const RATE_CACHE_TTL_MS = 86_400_000;

/** Tiempo máximo de espera a la API de tipos de cambio (RF16). */
export const RATE_FETCH_TIMEOUT_MS = 5_000;

/** URL base por defecto: tipos de referencia del BCE vía Frankfurter, sin clave (plan §2). */
export const DEFAULT_EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v1/latest';
