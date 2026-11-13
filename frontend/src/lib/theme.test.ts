import { describe, expect, it } from 'vitest';
import { applyTheme, readTheme, writeTheme } from './theme';

const storageWith = (value: string | null): Pick<Storage, 'getItem'> => ({ getItem: () => value });

describe('readTheme (RF29)', () => {
  it('es claro solo con el valor exacto "light"', () => {
    expect(readTheme(storageWith('light'))).toBe('light');
  });

  it.each([['dark'], ['foo'], ['Light'], [''], [null]])('es oscuro con %j', (value) => {
    expect(readTheme(storageWith(value))).toBe('dark');
  });

  it('es oscuro sin almacenamiento o si el acceso lanza', () => {
    expect(readTheme(undefined)).toBe('dark');
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(readTheme(broken)).toBe('dark');
  });
});

describe('writeTheme y applyTheme', () => {
  it('guarda en som-theme y no falla si el almacenamiento lanza', () => {
    const saved: Record<string, string> = {};
    writeTheme({ setItem: (k, v) => void (saved[k] = v) }, 'light');
    expect(saved).toEqual({ 'som-theme': 'light' });
    const broken = {
      setItem: () => {
        throw new Error('lleno');
      },
    };
    expect(() => { writeTheme(broken, 'dark'); }).not.toThrow();
    expect(() => { writeTheme(undefined, 'dark'); }).not.toThrow();
  });

  it('pone data-theme en el elemento raíz', () => {
    applyTheme(document.documentElement, 'light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    applyTheme(document.documentElement, 'dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
