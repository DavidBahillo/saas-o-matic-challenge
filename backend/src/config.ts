// Configuración del backend validada con Zod en el borde (plan §6.2): PORT, DB_PATH y EXCHANGE_RATES_URL.
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DEFAULT_EXCHANGE_RATES_URL } from './rates/constants';

export const DEFAULT_PORT = 3000;

/** `backend/data/saas-o-matic.db`, resuelta desde este archivo para no depender del cwd. */
export const DEFAULT_DB_PATH = fileURLToPath(new URL('../data/saas-o-matic.db', import.meta.url));

export interface AppConfig {
  port: number;
  dbPath: string;
  /** URL https del proveedor de tipos de cambio, usada tal cual (004, 007 RF2). */
  exchangeRatesUrl: string;
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

const PORT_MESSAGE = 'PORT debe ser un entero entre 1 y 65535.';
const DB_PATH_MESSAGE = 'DB_PATH debe ser una ruta no vacía y sin caracteres nulos.';

const RATES_URL_MESSAGE = 'EXCHANGE_RATES_URL debe ser una URL https válida.';

const RatesUrlSchema = z.url({ protocol: /^https$/, error: RATES_URL_MESSAGE });

const PortSchema = z
  .string()
  .regex(/^[0-9]{1,5}$/, PORT_MESSAGE)
  .transform(Number)
  .pipe(z.number().int().min(1, PORT_MESSAGE).max(65535, PORT_MESSAGE));

const DbPathSchema = z
  .string()
  .trim()
  .min(1, DB_PATH_MESSAGE)
  .refine((path) => !path.includes('\0'), DB_PATH_MESSAGE);

const EnvSchema = z.object({
  PORT: PortSchema.default(DEFAULT_PORT),
  DB_PATH: DbPathSchema.default(DEFAULT_DB_PATH),
  EXCHANGE_RATES_URL: RatesUrlSchema.default(DEFAULT_EXCHANGE_RATES_URL),
});

export function loadConfig(env: Readonly<Record<string, string | undefined>>): AppConfig {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const messages = [...new Set(result.error.issues.map((issue) => issue.message))];
    throw new ConfigError(`Configuración no válida: ${messages.join(' ')}`);
  }
  return {
    port: result.data.PORT,
    dbPath: result.data.DB_PATH,
    exchangeRatesUrl: result.data.EXCHANGE_RATES_URL,
  };
}
