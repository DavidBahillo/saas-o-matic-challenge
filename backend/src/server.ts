// Arranque del backend (plan §3): loadConfig → openDatabase → migrate → createApp → listen.
import { createApp } from './app';
import { ConfigError, loadConfig } from './config';
import { openDatabase } from './db/connection';
import { migrate } from './repositories/schema';

function fail(message: string, error?: unknown): never {
  console.error(message, error ?? '');
  process.exit(1);
}

function main(): void {
  const config = loadConfig(process.env);
  const db = openDatabase(config.dbPath);
  migrate(db);
  const app = createApp({ db });
  app.listen(config.port, (error?: Error) => {
    if (error) fail('No se pudo arrancar el backend:', error);
    console.log(`SaaS-O-Matic backend escuchando en http://localhost:${String(config.port)}`);
  });
}

try {
  main();
} catch (error) {
  if (error instanceof ConfigError) fail(error.message);
  fail('No se pudo arrancar el backend:', error);
}
