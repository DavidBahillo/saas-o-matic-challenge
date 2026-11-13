// Tecla P del modo presentación (RF30).
import { describe, expect, it } from 'vitest';
import { isPresentationHotkey, isTypingTarget } from './keyboard';

const el = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  const node = host.firstElementChild;
  if (!(node instanceof HTMLElement)) throw new Error('sin elemento');
  return node;
};

const press = (over: Partial<Parameters<typeof isPresentationHotkey>[0]> = {}) =>
  isPresentationHotkey({
    key: 'p',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    target: document.body,
    ...over,
  });

describe('isTypingTarget', () => {
  it.each([
    ['<input type="text">'],
    ['<input type="range">'],
    ['<input type="search">'],
    ['<select></select>'],
    ['<textarea></textarea>'],
    ['<div contenteditable="true"></div>'],
  ])('%s es un campo de escritura', (html) => {
    expect(isTypingTarget(el(html))).toBe(true);
  });

  it.each([['<button></button>'], ['<div></div>'], ['<a href="/">x</a>']])('%s no lo es', (html) => {
    expect(isTypingTarget(el(html))).toBe(false);
  });

  it('null y objetivos que no son elementos no lo son', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
  });
});

describe('isPresentationHotkey', () => {
  it('P sola, fuera de un campo, activa', () => {
    expect(press()).toBe(true);
    expect(press({ key: 'P' })).toBe(true);
  });

  it.each([['ctrlKey'], ['altKey'], ['metaKey'], ['shiftKey']] as const)('con %s no activa', (modifier) => {
    expect(press({ [modifier]: true })).toBe(false);
  });

  it('con el foco en un campo no activa', () => {
    expect(press({ target: el('<input>') })).toBe(false);
    expect(press({ target: el('<input type="range">') })).toBe(false);
    expect(press({ target: el('<select></select>') })).toBe(false);
    expect(press({ target: el('<textarea></textarea>') })).toBe(false);
  });

  it('otras teclas no activan', () => {
    expect(press({ key: 'o' })).toBe(false);
    expect(press({ key: 'Escape' })).toBe(false);
  });
});
