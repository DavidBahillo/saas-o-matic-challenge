// Orden español de clientes (RF24): sin distinguir mayúsculas ni tildes, Ñ después de N y
// desempate por id. Filas de la tabla "Búsqueda y consulta" de la spec 001.
import { describe, expect, it } from 'vitest';
import { compareByNameEs, sortByNameEs } from './sort-customers';
import type { Named } from './sort-customers';

function named(pairs: ReadonlyArray<readonly [string, number]>): Named[] {
  return pairs.map(([companyName, id]) => ({ companyName, id }));
}

function namesOf(items: readonly Named[]): string[] {
  return items.map((c) => `${c.companyName}#${String(c.id)}`);
}

describe('sortByNameEs', () => {
  it.each([
    {
      row: 'Bravo (1), Álvarez (2) → Álvarez, Bravo (Á se ordena con A)',
      input: [['Bravo', 1], ['Álvarez', 2]] as const,
      expected: ['Álvarez#2', 'Bravo#1'],
    },
    {
      row: 'Ñandú (1), Nube (2), Nzeta (3), Oasis (4) → Nube, Nzeta, Ñandú, Oasis',
      input: [['Ñandú', 1], ['Nube', 2], ['Nzeta', 3], ['Oasis', 4]] as const,
      expected: ['Nube#2', 'Nzeta#3', 'Ñandú#1', 'Oasis#4'],
    },
    {
      row: 'beta (1), Acme (3), acme (2), Ábaco (4) → Ábaco, acme, Acme, beta',
      input: [['beta', 1], ['Acme', 3], ['acme', 2], ['Ábaco', 4]] as const,
      expected: ['Ábaco#4', 'acme#2', 'Acme#3', 'beta#1'],
    },
    {
      row: 'acme (2), Ácme (1) → Ácme, acme (empate solo por tilde, desempate por id)',
      input: [['acme', 2], ['Ácme', 1]] as const,
      expected: ['Ácme#1', 'acme#2'],
    },
  ])('$row', ({ input, expected }) => {
    expect(namesOf(sortByNameEs(named(input)))).toEqual(expected);
  });

  it('el desempate por id no depende del orden de entrada', () => {
    const forward = sortByNameEs(named([['acme', 2], ['Acme', 3], ['ACME', 1]]));
    const backward = sortByNameEs(named([['ACME', 1], ['Acme', 3], ['acme', 2]]));
    expect(namesOf(forward)).toEqual(['ACME#1', 'acme#2', 'Acme#3']);
    expect(namesOf(backward)).toEqual(namesOf(forward));
  });

  it('no modifica el array de entrada y conserva los demás campos', () => {
    const input = [
      { companyName: 'Zeta', id: 1, extra: 'z' },
      { companyName: 'Alfa', id: 2, extra: 'a' },
    ];
    const sorted = sortByNameEs(input);
    expect(sorted.map((c) => c.extra)).toEqual(['a', 'z']);
    expect(input.map((c) => c.companyName)).toEqual(['Zeta', 'Alfa']);
  });

  it('devuelve un array vacío para una entrada vacía', () => {
    expect(sortByNameEs([])).toEqual([]);
  });
});

describe('compareByNameEs', () => {
  it('a < b, a > b y empate desempatado por id', () => {
    expect(compareByNameEs({ companyName: 'Nzeta', id: 9 }, { companyName: 'Ñandú', id: 1 })).toBeLessThan(0);
    expect(compareByNameEs({ companyName: 'Bravo', id: 1 }, { companyName: 'Álvarez', id: 2 })).toBeGreaterThan(0);
    expect(compareByNameEs({ companyName: 'acme', id: 2 }, { companyName: 'Acme', id: 3 })).toBeLessThan(0);
    expect(compareByNameEs({ companyName: 'Acme', id: 3 }, { companyName: 'Acme', id: 3 })).toBe(0);
  });
});
