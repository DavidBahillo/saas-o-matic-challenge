// Constantes con nombre de la caché y del proveedor de tipos de cambio (004 y 007; RF4, RF6, RF7).

/** Un snapshot es vigente mientras tenga menos de 24 horas (RF4). */
export const RATE_CACHE_TTL_MS = 86_400_000;

/** Tiempo máximo de espera a la API de tipos de cambio (RF6). */
export const RATE_FETCH_TIMEOUT_MS = 5_000;

/** Tras un fallo del proveedor no se le vuelve a llamar durante este tiempo (PT5, RF7). */
export const RATE_FAILURE_COOLDOWN_MS = 60_000;

/** URL por defecto: open.er-api.com con base EUR, sin clave (007, RF2). Se usa tal cual. */
export const DEFAULT_EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
