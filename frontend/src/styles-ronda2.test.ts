// Ronda 2 (RF39, RF42, RF41): reglas de CSS comprobadas por texto, sin literales de color ni de espaciado.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
const stripComments = (text: string): string => text.split('/*').map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2))).join('');
const css = (name: string): string => stripComments(readFileSync(join(import.meta.dirname, 'styles', name), 'utf8'));
const rules = (text: string): { selector: string; body: string }[] =>
  [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: (m[1] ?? '').trim(), body: m[2] ?? '' }));

describe('tabla del desglose centrada (RF42)', () => {
  const table = rules(css('simulator.css')).filter((r) => r.selector.includes('.quote-table'));

  it('ninguna regla .quote-table alinea a la derecha o a la izquierda', () => {
    expect(table.length).toBeGreaterThan(0);
    for (const r of table) expect(r.body).not.toMatch(/text-align:\s*(right|left)/);
  });

  it('th y td se centran y la tabla y su contenedor ocupan el 100 %', () => {
    const cells = table.find((r) => r.selector.includes('.quote-table th') && r.selector.includes('.quote-table td'));
    expect(cells?.body).toMatch(/text-align:\s*center/);
    expect(table.find((r) => r.selector === '.quote-table')?.body).toMatch(/width:\s*100%/);
    expect(table.find((r) => r.selector === '.quote-table-wrap')?.body).toMatch(/width:\s*100%/);
  });
});

describe('flecha de los select (RF39)', () => {
  const rule = rules(css('components.css')).find((r) => r.selector === 'select.input');

  it('appearance none y relleno con calc de tokens; el chevron va en .select-shell (spec 010)', () => {
    expect(rule?.body).toMatch(/appearance:\s*none/);
    expect(rule?.body).toMatch(/padding-right:\s*calc\(var\(--space-md\) \+ var\(--space-lg\)\)/);
    const chevron = rules(css('components.css')).find((r) => r.selector === '.select-shell::after');
    expect(chevron?.body).toMatch(/right:\s*var\(--space-md\)/);
  });
});

describe('barra sin leyenda (RF41)', () => {
  it('no quedan reglas de leyenda bajo la barra', () => {
    expect(css('simulator.css')).not.toMatch(/stack__outside|stack__swatch/);
  });
});

describe('nada se parte a mitad de palabra (caso límite a 360 px)', () => {
  const table = rules(css('simulator.css')).filter((r) => r.selector.includes('.quote-table'));
  const has = (sel: string, re: RegExp): boolean => table.some((r) => r.selector.split(',').some((p) => p.trim() === sel) && re.test(r.body));

  it('importes, unidades y cabeceras no saltan de línea; ninguna celda parte palabras', () => {
    expect(has('.quote-table td', /white-space:\s*nowrap/)).toBe(true);
    expect(has('.quote-table thead th', /white-space:\s*nowrap/)).toBe(true);
    expect(has('.quote-table th', /overflow-wrap:\s*normal/)).toBe(true);
    expect(has('.quote-table td', /overflow-wrap:\s*normal/)).toBe(true);
  });

  it('el contenedor se desplaza por dentro y los chips no se parten', () => {
    expect(rules(css('simulator.css')).find((r) => r.selector === '.quote-table-wrap')?.body).toMatch(/overflow-x:\s*auto/);
    const badge = rules(css('components.css')).find((r) => r.selector === '.badge');
    expect(badge?.body).toMatch(/white-space:\s*nowrap/);
    expect(badge?.body).toMatch(/overflow-wrap:\s*normal/);
  });
});

describe('escalera de cuadrados (RF43)', () => {
  const ws = css('workspace.css');
  const step = rules(ws).find((r) => r.selector === '.ladder__step');

  it('sin leyenda ni muestra, y el escalón es un cuadrado sin altura propia', () => {
    expect(ws).not.toMatch(/ladder__legend|ladder__swatch/);
    expect(step?.body).toMatch(/aspect-ratio:\s*1/);
    expect(step?.body).not.toMatch(/(^|[;\s])height:/);
    expect(step?.body).toMatch(/flex:\s*none/);
  });

  it('el lado es 2 x --space-2xl por la escala, con tope de un tercio del ancho útil', () => {
    expect(step?.body).toMatch(/width:\s*min\(calc\(var\(--space-2xl\) \* 2 \* var\(--scale, 1\)\), calc\(\(100% - 2 \* var\(--space-sm\)\) \/ 3\)\)/);
  });
});

describe('foco visible sin outline: none (RF49)', () => {
  const files = ['base.css', 'components.css', 'controls.css', 'layout.css', 'lists.css', 'simulator.css', 'workspace.css'];

  it('ninguna regla :focus-visible usa outline: none', () => {
    for (const f of files) {
      for (const r of rules(css(f)).filter((x) => x.selector.includes(':focus-visible'))) {
        expect(`${f} ${r.selector}: ${r.body}`).not.toMatch(/outline:\s*none/);
      }
    }
  });

  it('.input:focus-visible usa un contorno transparente de 2 px con separación (lo pinta forced-colors)', () => {
    const rule = rules(css('components.css')).find((r) => r.selector === '.input:focus-visible');
    expect(rule?.body).toMatch(/outline:\s*2px solid transparent/);
    expect(rule?.body).toMatch(/outline-offset:\s*2px/);
    expect(rule?.body).toMatch(/box-shadow/);
  });
});

describe('lista de clientes: CSS (RF55)', () => {
  const lists = css('lists.css');
  const all = rules(lists);

  it('en apilado la cabecera se oculta con la técnica sr-only, no con display: none, y no hay ::before de "Alta"', () => {
    const head = all.find((r) => r.selector === '.customer-list > thead' && /clip-path/.test(r.body));
    expect(head?.body).not.toMatch(/display:\s*none/);
    expect(lists).not.toMatch(/content:\s*'Alta/);
    expect(all.some((r) => r.selector === '.customer-row__since-label, .customer-row__label' && /display:\s*none/.test(r.body))).toBe(true);
  });

  it('correo y NIF son seleccionables por encima del enlace estirado y las cifras son tabulares', () => {
    const sel = all.find((r) => r.selector.includes('.customer-row__company .muted') && r.body.includes('user-select'));
    expect(sel?.body).toMatch(/position:\s*relative/);
    expect(sel?.body).toMatch(/z-index:\s*1/);
    expect(sel?.body).toMatch(/user-select:\s*text/);
    expect(all.find((r) => r.selector.includes('.customer-row__since') && r.body.includes('font-size'))?.body).toMatch(/tabular-nums/);
  });
});

describe('CSS global (RF59)', () => {
  const raw = (name: string): string => stripComments(readFileSync(join(import.meta.dirname, 'styles', name), 'utf8'));

  it('body no lleva overflow-wrap: anywhere; botones, chips y cabeceras lo tienen en normal', () => {
    const base = rules(css('base.css'));
    expect(base.find((r) => r.selector === 'body')?.body).not.toMatch(/overflow-wrap/);
    expect(base.find((r) => r.selector.includes('.customer-row__company') && /anywhere/.test(r.body))?.selector).toContain('h1');
    expect(base.find((r) => r.selector === 'th, .btn')?.body).toMatch(/overflow-wrap:\s*normal/);
    expect(rules(css('components.css')).find((r) => r.selector === '.badge')?.body).toMatch(/overflow-wrap:\s*normal/);
  });

  it('overscroll-behavior: none solo con pointer: fine', () => {
    const base = css('base.css');
    expect(base).toMatch(/@media \(pointer: fine\)\s*\{\s*html\s*\{\s*overscroll-behavior:\s*none/);
    expect(base.replace(/@media \(pointer: fine\)[^]*?\}\s*\}/, '')).not.toMatch(/overscroll-behavior/);
  });

  it('la tabla a 480 px usa var(--space-xs) y no 4px', () => {
    expect(css('simulator.css')).not.toMatch(/\b4px\b/);
    expect(css('simulator.css')).toMatch(/padding:\s*var\(--space-sm\) var\(--space-xs\)/);
  });

  it('.content:focus sin contorno está documentado', () => {
    const layout = readFileSync(join(import.meta.dirname, 'styles', 'layout.css'), 'utf8');
    expect(layout).toMatch(/\/\*[^*]*Saltar al contenido[^*]*\*\/\s*\.content:focus/);
    expect(raw('layout.css')).toMatch(/\.content:focus/);
  });
});

describe('cabeceras de la tabla del desglose (RF52)', () => {
  it('las cabeceras de fila pesan 500 (sin negrita sintética) y solo los importes del total pesan 600', () => {
    const table = rules(css('simulator.css')).filter((r) => r.selector.includes('.quote-table'));
    expect(table.find((r) => r.selector === '.quote-table th')?.body).toMatch(/font-weight:\s*500/);
    expect(table.find((r) => r.selector === '.quote-table [data-row="total"] td')?.body).toMatch(/font-weight:\s*600/);
  });
});

describe('re-auditoría T12', () => {
  it('móvil: la celda del botón de guardadas cubre toda la fila (objetivo táctil de la altura de la fila)', () => {
    const lists = css('lists.css');
    const mobile = lists.slice(lists.lastIndexOf('@media (max-width: 639px)'));
    const toggle = rules(mobile.slice(mobile.indexOf('{') + 1)).find((r) => r.selector === '.sim-row__toggle');
    expect(toggle?.body).toMatch(/position:\s*absolute/);
    expect(toggle?.body).toMatch(/inset:\s*0/);
    expect(toggle?.body).not.toMatch(/width:/);
    expect(rules(lists).find((r) => r.selector === '.sim-row' )?.body).toMatch(/min-height:\s*48px/);
    expect(rules(lists).find((r) => r.selector === '.sim-row' )?.body).toMatch(/position:\s*relative/);
  });

  it('forced-colors: el borde de los segmentos de la barra tiene más especificidad que border: 0', () => {
    const forced = css('base.css').slice(css('base.css').indexOf('@media (forced-colors: active)'));
    expect(forced).toMatch(/\.stack \.stack__seg/);
    expect(css('simulator.css')).toMatch(/\.stack__seg span:not\(\.sr-only\)/);
  });

  it('el texto libre de estados y errores parte palabras largas; botones, chips y cabeceras no', () => {
    const wrap = rules(css('base.css')).find((r) => /anywhere/.test(r.body) && r.selector.includes('.state'));
    for (const sel of ['.state', '.field__error', '.notice']) expect(wrap?.selector).toContain(sel);
    for (const sel of ['.btn', '.badge', 'th']) expect(wrap?.selector.split(',').map((s) => s.trim())).not.toContain(sel);
  });

  it('.content:focus usa un contorno transparente, no outline: none', () => {
    const rule = rules(css('layout.css')).find((r) => r.selector === '.content:focus');
    expect(rule?.body).toMatch(/outline:\s*2px solid transparent/);
  });
});
