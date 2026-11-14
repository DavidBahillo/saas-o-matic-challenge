// RF6, RF-tema1, RF-tema2: fuentes de Google, sin Inter, sin tema fijo y script de tema antes del primer pintado.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

type FakeStorage = { getItem: (key: string) => string | null };

function runScript(storage: () => FakeStorage): string | null {
  const attrs: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (k: string, v: string) => void (attrs[k] = v) } };
  const win = {
    get localStorage(): FakeStorage {
      return storage();
    },
  };
  runInNewContext(script, { window: win, document });
  return attrs['data-theme'] ?? null;
}

const stored = (value: string | null) => (): FakeStorage => ({ getItem: () => value });

describe('index.html', () => {
  it('carga las fuentes con una petición css2, display=swap y preconnect, sin Inter', () => {
    const href = /href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"/.exec(html)?.[1] ?? '';
    expect(href).toContain('family=Plus+Jakarta+Sans:wght@500;600;700');
    expect(href).toContain('family=DM+Sans:wght@400;500');
    expect(href).toContain('family=Fira+Code:wght@400;600');
    expect(href).toContain('display=swap');
    expect(html).toMatch(/rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/);
    expect(html).toMatch(/rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/);
    expect(html).toMatch(/rel="preconnect" href="https:\/\/flagcdn\.com"/);
    expect(html).not.toMatch(/inter/i);
  });

  it('no fija data-theme ni theme-color', () => {
    expect(html).not.toMatch(/<html[^>]*data-theme/);
    expect(html).not.toMatch(/theme-color/);
  });

  it('el script va en el head, antes de la hoja de fuentes y del módulo', () => {
    expect(html.indexOf('<script>')).toBeGreaterThan(html.indexOf('<head>'));
    expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('</head>'));
    expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('type="module"'));
  });

  it.each([
    ['sin valor', stored(null), 'dark'],
    ['light', stored('light'), 'light'],
    ['dark', stored('dark'), 'dark'],
    ['valor inválido', stored('azul'), 'dark'],
    [
      'getItem lanza',
      () => ({ getItem: () => { throw new Error('bloqueado'); } }),
      'dark',
    ],
    [
      'el acceso a localStorage lanza',
      () => { throw new Error('denegado'); },
      'dark',
    ],
  ])('fija el tema: %s', (_name, storage, expected) => {
    expect(runScript(storage)).toBe(expected);
  });
});
