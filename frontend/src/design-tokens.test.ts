// RF2, RF3, RF36: tokens de DESIGN.md y detección de literales de color, sombra, radio y familia en CSS, TSX e index.html.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colorViolations, inlineStyleViolations } from './test/token-rules';

const SRC = import.meta.dirname;
const DESIGN = join(SRC, '..', '..', 'DESIGN.md');
const INDEX = join(SRC, '..', 'index.html');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

const normalize = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isChecked = (file: string): boolean =>
  /\.(css|tsx|html)$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith('tokens.css') && !file.includes(join('src', 'test'));
const checked = (): string[] => [...sourceFiles(SRC), INDEX].filter(isChecked);

function fileViolations(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  if (!file.endsWith('.tsx')) return colorViolations(text);
  return [...(/#[0-9a-fA-F]{3,8}\b/.test(text) ? ['hexadecimal'] : []), ...inlineStyleViolations(text)];
}

describe('detección de literales (RF3)', () => {
  it.each([
    ['hexadecimal', '.a { color: #fff; }'],
    ['rgb', '.a { background: rgb(0 0 0); }'],
    ['hsl', '.a { color: hsla(10, 20%, 30%, 1); }'],
    ['oklch', '.a { color: oklch(50% 0.1 20); }'],
    ['color-mix', '.a { color: color-mix(in srgb, red, blue); }'],
    ['nombre de color', '.a { background-color: tomato; }'],
    ['sombra con color', '.a { box-shadow: 0 0 4px black; }'],
    ['radio literal', '.a { border-radius: 6px; }'],
    ['familia literal', '.a { font-family: Inter, sans-serif; }'],
    ['font con familia', '.a { font: 400 14px/1.5 Inter, system-ui; }'],
  ])('rechaza %s', (_name, css) => {
    expect(colorViolations(css).length).toBeGreaterThan(0);
  });

  it('acepta tokens, transparent, currentColor y colores de sistema en forced-colors', () => {
    const css = `.a { color: var(--color-text); border: 1px solid transparent; fill: currentColor; border-radius: var(--radius) 0 50% inherit; box-shadow: var(--shadow-md); font: 400 1rem var(--font-body); }
      @media (forced-colors: active) { .a { border: 1px solid CanvasText; background: Highlight; color: red; } }`;
    expect(colorViolations(css)).toEqual([]);
  });

  it('rechaza estilos en línea con color, fondo, borde, sombra o familia, y fill literal', () => {
    expect(inlineStyleViolations('<i style={{ color: "x" }} />').length).toBe(1);
    expect(inlineStyleViolations('<i style={{ boxShadow: "x" }} />').length).toBe(1);
    expect(inlineStyleViolations('<svg fill="red" />').length).toBe(1);
    expect(inlineStyleViolations('<i style={{ flexGrow: 3, left: "10%" }} fill="none" />')).toEqual([]);
  });
});

describe('tokens de diseño', () => {
  it('no hay literales de color, sombra, radio ni familia en CSS, TSX ni index.html fuera de tokens.css', () => {
    const offenders = checked().flatMap((file) => fileViolations(file).map((v) => `${file}: ${v}`));
    expect(offenders).toEqual([]);
  });

  it('tokens.css coincide con el primer bloque CSS de DESIGN.md (RF2)', () => {
    const design = readFileSync(DESIGN, 'utf8');
    expect(design.match(/```css/g)?.length).toBe(1);
    const block = /```css\n([\s\S]*?)```/.exec(design)?.[1];
    expect(block).toBeDefined();
    const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8');
    expect(normalize(tokens)).toBe(normalize(block ?? ''));
  });

  it('los tokens antiguos ya no existen', () => {
    const old = /var\(--(bg|surface|surface-2|border|text|text-muted|primary|primary-contrast|secondary|tertiary|success|warning|error|info)\)/;
    const offenders = checked().filter((file) => old.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('DESIGN.md describe el selector con CHF y flagcdn.com, sin salud ni atribución (RF36)', () => {
    const design = readFileSync(DESIGN, 'utf8');
    expect(design).toMatch(/CHF/);
    expect(design).toMatch(/flagcdn\.com/);
    expect(design).not.toMatch(/ExchangeRate-API/i);
    expect(design).not.toMatch(/health|salud|patient|clinical|telehealth/i);
  });
});
