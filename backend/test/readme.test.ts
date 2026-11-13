// Spec 006 · T3 (CA6): scripts, variables, endpoints y enlaces del README existen y el ejemplo de petición es válido.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/connection';
import { migrate } from '../src/repositories/schema';
import { runSeed } from '../src/seed/run-seed';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path: string): string => readFileSync(resolve(ROOT, path), 'utf8');

const REQUIRED_SCRIPTS = ['dev', 'seed', 'test', 'lint'];

function findMissingScripts(readme: string, scripts: Record<string, string>): string[] {
  const used = [...readme.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1] ?? '');
  return [...new Set(used)].filter((name) => !(name in scripts));
}

function findMissingEnvVars(readme: string, config: string): string[] {
  const rows = [...readme.matchAll(/^\| `([A-Z][A-Z_]+)` \|/gm)].map((m) => m[1] ?? '');
  return rows.filter((name) => name !== 'BACKEND_URL' && !config.includes(name));
}

function findMissingEndpoints(readme: string, routes: string): string[] {
  const rows = [...readme.matchAll(/^\| `(GET|POST) (\/[^`]*)` \|/gm)];
  return rows
    .map((m) => ({ method: (m[1] ?? '').toLowerCase(), path: m[2] ?? '' }))
    .filter(({ method, path }) => !routes.includes(`router.${method}('${path}'`))
    .map(({ method, path }) => `${method} ${path}`);
}

function findBrokenLinks(readme: string, exists: (path: string) => boolean): string[] {
  const links = [...readme.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1] ?? '');
  return links.filter((l) => !/^[a-z]+:/.test(l) && !exists(l.split('#')[0] ?? ''));
}

const readme = read('README.md');
const routesDir = resolve(ROOT, 'backend/src/routes');
const routes = readdirSync(routesDir)
  .filter((f) => f.endsWith('.routes.ts'))
  .map((f) => readFileSync(resolve(routesDir, f), 'utf8'))
  .join('\n');
const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;

describe('README coherente con el proyecto', () => {
  it('cada npm run citado existe y están los obligatorios', () => {
    expect(findMissingScripts(readme, scripts)).toEqual([]);
    for (const name of REQUIRED_SCRIPTS) expect(readme).toContain(`npm run ${name}`);
  });

  it('PORT, DB_PATH y EXCHANGE_RATES_URL están documentadas y existen en config.ts', () => {
    const config = read('backend/src/config.ts');
    expect(findMissingEnvVars(readme, config)).toEqual([]);
    for (const name of ['PORT', 'DB_PATH', 'EXCHANGE_RATES_URL']) expect(readme).toContain(`| \`${name}\` |`);
  });

  it('cada endpoint documentado existe en routes/ y están los 7', () => {
    expect(findMissingEndpoints(readme, routes)).toEqual([]);
    expect([...readme.matchAll(/^\| `(GET|POST) \//gm)]).toHaveLength(7);
  });

  it('cada enlace relativo apunta a un archivo o carpeta existente', () => {
    const links = [...readme.matchAll(/\]\(([^)]+)\)/g)];
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(findBrokenLinks(readme, (p) => existsSync(resolve(ROOT, p)))).toEqual([]);
  });

  it('el comprobador falla si algo se rompe', () => {
    expect(findMissingScripts('npm run nada', scripts)).toEqual(['nada']);
    expect(findMissingEnvVars('| `FOO_BAR` | x |', 'PORT')).toEqual(['FOO_BAR']);
    expect(findMissingEndpoints('| `GET /nada` | x |', routes)).toEqual(['get /nada']);
    expect(findBrokenLinks('[x](no-existe.md)', () => false)).toEqual(['no-existe.md']);
  });

  it('el ejemplo curl es una petición válida contra la API', async () => {
    const body = /-d '([^']+)'/.exec(readme)?.[1];
    expect(body).toBeDefined();
    const db = openDatabase(':memory:');
    migrate(db);
    await runSeed(db);
    const app = createApp({ db, rateProvider: { fetchRate: () => Promise.reject(new Error('sin red')) } });
    const res = await request(app).post('/simulations').set('Content-Type', 'application/json').send(body);
    expect(res.status).toBe(201);
    db.close();
  });
});
