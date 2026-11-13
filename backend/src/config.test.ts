// Tests de loadConfig (plan §6.2): valores por defecto y validación de PORT y DB_PATH con Zod.
import { isAbsolute, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, DEFAULT_DB_PATH, DEFAULT_PORT, loadConfig } from './config';
import { DEFAULT_EXCHANGE_RATES_URL } from './rates/constants';

describe('loadConfig · valores por defecto', () => {
  it('sin variables usa el puerto 3000 y la BD en backend/data', () => {
    const config = loadConfig({});
    expect(config).toEqual({ port: DEFAULT_PORT, dbPath: DEFAULT_DB_PATH, exchangeRatesUrl: DEFAULT_EXCHANGE_RATES_URL });
    expect(config.port).toBe(3000);
  });

  it('la ruta por defecto es absoluta y apunta a backend/data/saas-o-matic.db', () => {
    expect(isAbsolute(DEFAULT_DB_PATH)).toBe(true);
    expect(DEFAULT_DB_PATH.endsWith(join('backend', 'data', 'saas-o-matic.db'))).toBe(true);
  });

  it('ignora las variables de entorno que no son de la configuración', () => {
    expect(loadConfig({ HOME: '/home/x', NODE_ENV: 'test' })).toEqual({
      port: DEFAULT_PORT,
      dbPath: DEFAULT_DB_PATH,
      exchangeRatesUrl: DEFAULT_EXCHANGE_RATES_URL,
    });
  });
});

describe('loadConfig · PORT', () => {
  it.each([
    ['1', 1],
    ['8080', 8080],
    ['65535', 65535],
  ])('PORT=%j → %i', (raw, port) => {
    expect(loadConfig({ PORT: raw }).port).toBe(port);
  });

  it.each(['', ' ', 'abc', '0', '65536', '3.5', '-1', '+80', '80 ', '1e3', '0x50'])(
    'PORT=%j → ConfigError',
    (raw) => {
      expect(() => loadConfig({ PORT: raw })).toThrow(ConfigError);
    },
  );

  it('el mensaje de error nombra la variable', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});

describe('loadConfig · DB_PATH', () => {
  it.each([':memory:', 'data/otra.db', '/tmp/saas.db'])('DB_PATH=%j se acepta tal cual', (raw) => {
    expect(loadConfig({ DB_PATH: raw }).dbPath).toBe(raw);
  });

  it('recorta los espacios de los extremos', () => {
    expect(loadConfig({ DB_PATH: '  data/x.db  ' }).dbPath).toBe('data/x.db');
  });

  it.each(['', '   ', 'data/\0.db'])('DB_PATH=%j → ConfigError', (raw) => {
    expect(() => loadConfig({ DB_PATH: raw })).toThrow(ConfigError);
  });

  it('el mensaje de error nombra la variable', () => {
    expect(() => loadConfig({ DB_PATH: '' })).toThrow(/DB_PATH/);
  });
});

describe('loadConfig · EXCHANGE_RATES_URL', () => {
  it('por defecto es la URL de Frankfurter', () => {
    expect(loadConfig({}).exchangeRatesUrl).toBe('https://api.frankfurter.dev/v1/latest');
  });

  it('acepta una URL https', () => {
    expect(loadConfig({ EXCHANGE_RATES_URL: 'https://rates.example.test/latest' }).exchangeRatesUrl).toBe(
      'https://rates.example.test/latest',
    );
  });

  it.each(['', 'http://rates.example.test', 'ftp://x.test', 'no es una url', 'https://'])(
    'EXCHANGE_RATES_URL=%j → ConfigError',
    (raw) => {
      expect(() => loadConfig({ EXCHANGE_RATES_URL: raw })).toThrow(ConfigError);
    },
  );

  it('el mensaje de error nombra la variable', () => {
    expect(() => loadConfig({ EXCHANGE_RATES_URL: 'http://x.test' })).toThrow(/EXCHANGE_RATES_URL/);
  });
});
