// Atajo Alt+P del modo presentación (RF48).
import { describe, expect, it } from 'vitest';
import { isPresentationHotkey, isTextEntryTarget } from './keyboard';

const el = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  const node = host.firstElementChild;
  if (!(node instanceof HTMLElement)) throw new Error('sin elemento');
  return node;
};

const press = (over: Partial<Parameters<typeof isPresentationHotkey>[0]> = {}) =>
  isPresentationHotkey({
    code: 'KeyP',
    ctrlKey: false,
    altKey: true,
    metaKey: false,
    shiftKey: false,
    target: document.body,
    ...over,
  });

describe('isTextEntryTarget', () => {
  it.each([
    ['<input type="text">'],
    ['<input type="search">'],
    ['<textarea></textarea>'],
    ['<div contenteditable="true"></div>'],
  ])('%s es un campo de escritura', (html) => {
    expect(isTextEntryTarget(el(html))).toBe(true);
  });

  it.each([
    ['<button></button>'],
    ['<div></div>'],
    ['<a href="/">x</a>'],
    ['<input type="range">'],
    ['<input type="checkbox">'],
    ['<select></select>'],
  ])('%s no lo es', (html) => {
    expect(isTextEntryTarget(el(html))).toBe(false);
  });

  it('null y objetivos que no son elementos no lo son', () => {
    expect(isTextEntryTarget(null)).toBe(false);
    expect(isTextEntryTarget(window)).toBe(false);
  });
});

describe('isPresentationHotkey', () => {
  it('Alt+P (por code), fuera de un campo, activa', () => {
    expect(press()).toBe(true);
  });

  it('Option+P de Mac produce otro carácter pero el mismo code y activa', () => {
    expect(press({ code: 'KeyP' })).toBe(true);
  });

  it('P sola ya no hace nada', () => {
    expect(press({ altKey: false })).toBe(false);
  });

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey']] as const)('con Alt y %s no activa', (modifier) => {
    expect(press({ [modifier]: true })).toBe(false);
  });

  it('con el foco en un campo de texto o textarea no activa', () => {
    expect(press({ target: el('<input>') })).toBe(false);
    expect(press({ target: el('<input type="email">') })).toBe(false);
    expect(press({ target: el('<textarea></textarea>') })).toBe(false);
    expect(press({ target: el('<div contenteditable="true"></div>') })).toBe(false);
  });

  it('en el slider o un select (no escriben nada) sí activa', () => {
    expect(press({ target: el('<input type="range">') })).toBe(true);
    expect(press({ target: el('<select></select>') })).toBe(true);
  });

  it('otras teclas no activan', () => {
    expect(press({ code: 'KeyO' })).toBe(false);
    expect(press({ code: 'Escape' })).toBe(false);
  });
});
