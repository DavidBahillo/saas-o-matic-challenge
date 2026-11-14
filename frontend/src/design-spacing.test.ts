// RF4: espaciado solo con la escala de DESIGN.md y sus excepciones, en todos los CSS (salvo tokens.css).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spacingViolations } from './test/token-rules';

const STYLES = join(import.meta.dirname, 'styles');

describe('regla de espaciado (RF4)', () => {
  it('rechaza 12 px y otros valores fuera de la escala', () => {
    expect(spacingViolations('.a { padding: 12px; }').length).toBe(1);
    expect(spacingViolations('.a { gap: 8px 16px; }').length).toBe(1);
    expect(spacingViolations('.a { margin: 0 11px; }').length).toBe(1);
    expect(spacingViolations('.a { inset: 5px; }').length).toBe(1);
  });

  it('acepta tokens, 0, auto, calc con tokens y los literales de componentes', () => {
    const css = `.a { padding: 10px 22px; margin: 0 auto; gap: var(--space-sm) var(--space-md); padding-inline: calc(var(--space-md) + 2px); inset: 0; }
      .b { padding: 6px 14px; margin: 28px 0 0; }
      @media (max-width: 480px) { .quote-table td { padding: var(--space-sm) 4px; } }`;
    expect(spacingViolations(css)).toEqual([]);
    expect(spacingViolations('.x td { padding: 4px; }').length).toBe(1);
  });

  it('todos los .css de styles/ cumplen la escala', () => {
    const offenders = readdirSync(STYLES)
      .filter((f) => f.endsWith('.css') && f !== 'tokens.css')
      .flatMap((f) => spacingViolations(readFileSync(join(STYLES, f), 'utf8')).map((v) => `${f}: ${v}`));
    expect(offenders).toEqual([]);
  });
});
