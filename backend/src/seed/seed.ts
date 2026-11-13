// Entrada CLI del seed (plan §7), como server.ts: loadConfig → openDatabase → migrate → runSeed.
// Éxito: resumen por stdout y código 0. Error: motivo por stderr y código 1.
import { ConfigError, loadConfig } from '../config';
import { openDatabase } from '../db/connection';
import { migrate } from '../repositories/schema';
import { formatSummary } from './format-summary';
import { SeedDataError, runSeed } from './run-seed';

function describeError(error: unknown): string {
  if (error instanceof ConfigError) return error.message;
  if (error instanceof SeedDataError) return `Seed fallido:\n${error.message}`;
  return `Seed fallido: ${error instanceof Error ? error.message : String(error)}`;
}

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const db = openDatabase(config.dbPath);
  try {
    migrate(db);
    console.log(formatSummary(await runSeed(db)));
  } finally {
    db.close();
  }
}

main().catch((error: unknown) => {
  console.error(describeError(error));
  process.exitCode = 1;
});
