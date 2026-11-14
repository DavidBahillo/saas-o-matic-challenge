// RF3, RF5, RF11: URL de la lista, retorno validado y aviso del estado de navegación.
import { describe, expect, it } from 'vitest';
import { listUrl, readNotice, safeFrom } from './list-url';

describe('listUrl', () => {
  it('omite page=1 y q vacío', () => {
    expect(listUrl('', 1)).toBe('/');
    expect(listUrl('acme', 1)).toBe('/?q=acme');
    expect(listUrl('', 3)).toBe('/?page=3');
    expect(listUrl('a b&c', 2)).toBe('/?q=a%20b%26c&page=2');
  });
});

describe('safeFrom', () => {
  it('acepta rutas internas y cae a / en cualquier otro caso', () => {
    expect(safeFrom({ from: '/?q=a&page=2' })).toBe('/?q=a&page=2');
    for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'customers', '', 5, undefined, null]) {
      expect(safeFrom({ from: bad })).toBe('/');
    }
    expect(safeFrom(null)).toBe('/');
    expect(safeFrom('x')).toBe('/');
  });
});

describe('readNotice', () => {
  it('lee un texto y descarta el resto', () => {
    expect(readNotice({ notice: 'Hecho' })).toBe('Hecho');
    expect(readNotice({ notice: 3 })).toBe('');
    expect(readNotice(null)).toBe('');
  });
});
