// Paginación pura (spec 009, RF1, RF3, RF5): parsePageParam, lastPage, paginate, pageRange y pageWindow.
import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, lastPage, pageRange, pageWindow, paginate, parsePageParam } from './pagination';

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

describe('parsePageParam', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    ['10', 10],
    ['9007199254740991', 9007199254740991],
  ])('%j → %d', (raw, expected) => {
    expect(parsePageParam(raw)).toBe(expected);
  });

  it.each([
    undefined, null, '', '0', '-1', '1.5', '007', '1e1', '+2', 'abc', ' 2', '2 ', ['2'], ['2', '3'],
    { a: '1' }, 5, '99999999999999999999', '9007199254740992',
  ])('%j → 1', (raw) => {
    expect(parsePageParam(raw)).toBe(1);
  });
});

describe('lastPage', () => {
  it.each([[0, 1], [1, 1], [20, 1], [21, 2], [40, 2], [41, 3], [230, 12]])('%d clientes → %d', (total, last) => {
    expect(lastPage(total, PAGE_SIZE)).toBe(last);
  });
});

describe('paginate', () => {
  it.each([
    [0, 1, 0, 1], [1, 1, 1, 1], [10, 1, 10, 1], [11, 1, 11, 1], [20, 1, 20, 1],
    [21, 2, 1, 2], [40, 2, 20, 2], [41, 3, 1, 3], [50, 3, 10, 3], [51, 3, 11, 3],
  ])('%d clientes, última página', (total, last, lastCount, pages) => {
    const slice = paginate(range(total), 999, PAGE_SIZE);
    expect(slice.page).toBe(last);
    expect(slice.items).toHaveLength(lastCount);
    expect(lastPage(total, PAGE_SIZE)).toBe(pages);
    expect(slice).toMatchObject({ total, pageSize: PAGE_SIZE });
  });

  it('recorre todas las páginas sin repetir ni omitir', () => {
    const all = range(51);
    const seen = [1, 2, 3].flatMap((p) => paginate(all, p, PAGE_SIZE).items);
    expect(seen).toEqual(all);
  });

  it('recorta páginas menores que 1 y fuera de rango', () => {
    expect(paginate(range(45), 0, 20).page).toBe(1);
    expect(paginate(range(45), -3, 20).page).toBe(1);
    expect(paginate(range(45), 3, 20).items).toEqual([41, 42, 43, 44, 45]);
    expect(paginate([], 5, 20)).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });
});

describe('pageRange', () => {
  it('devuelve el rango 1-based visible', () => {
    expect(pageRange(2, 20, 230)).toEqual({ from: 21, to: 40 });
    expect(pageRange(2, 20, 21)).toEqual({ from: 21, to: 21 });
    expect(pageRange(12, 20, 230)).toEqual({ from: 221, to: 230 });
    expect(pageRange(1, 20, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe('pageWindow', () => {
  it('con 7 páginas o menos las muestra todas', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('con muchas páginas usa elipsis', () => {
    expect(pageWindow(15, 30)).toEqual([1, 'gap-start', 14, 15, 16, 'gap-end', 30]);
    expect(pageWindow(1, 30)).toEqual([1, 2, 'gap-end', 30]);
    expect(pageWindow(30, 30)).toEqual([1, 'gap-start', 29, 30]);
    expect(pageWindow(2, 30)).toEqual([1, 2, 3, 'gap-end', 30]);
    expect(pageWindow(3, 30)).toEqual([1, 2, 3, 4, 'gap-end', 30]);
    expect(pageWindow(29, 30)).toEqual([1, 'gap-start', 28, 29, 30]);
  });

  it('no pone elipsis cuando el hueco es de una sola página', () => {
    expect(pageWindow(4, 9)).toEqual([1, 2, 3, 4, 5, 'gap-end', 9]);
    expect(pageWindow(5, 9)).toEqual([1, 'gap-start', 4, 5, 6, 'gap-end', 9]);
  });
});
