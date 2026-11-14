// Paginación pura (spec 009, plan §2.1). La usan el backend y el frontend: una sola fuente de verdad.

export const PAGE_SIZE = 20;

const CANONICAL_PAGE = /^[1-9]\d*$/;

/** Entero positivo canónico y seguro; cualquier otra cosa (incluidos arrays y desbordes) → 1 (RF5). */
export function parsePageParam(raw: unknown): number {
  if (typeof raw !== 'string' || !CANONICAL_PAGE.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : 1;
}

/** Última página válida; con 0 elementos sigue siendo la 1. */
export function lastPage(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export interface PageSlice<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Recorta `page` a [1, lastPage] y devuelve la porción y la página efectiva (RF5). */
export function paginate<T>(all: readonly T[], requestedPage: number, pageSize: number): PageSlice<T> {
  const page = Math.min(Math.max(1, requestedPage), lastPage(all.length, pageSize));
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total: all.length, page, pageSize };
}

/** Rango 1-based visible; con total 0 → { from: 0, to: 0 }. */
export function pageRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) };
}

export type PageItem = number | 'gap-start' | 'gap-end';

const FULL_WINDOW_MAX = 7;

/** Selector con elipsis: hasta 7 páginas, todas; si no, primera, actual ± 1, última y huecos. */
export function pageWindow(page: number, last: number): PageItem[] {
  if (last <= FULL_WINDOW_MAX) return Array.from({ length: last }, (_, i) => i + 1);
  const from = Math.max(2, page - 1);
  const to = Math.min(last - 1, page + 1);
  const items: PageItem[] = [1];
  if (from === 3) items.push(2);
  else if (from > 3) items.push('gap-start');
  for (let p = from; p <= to; p += 1) items.push(p);
  if (to === last - 2) items.push(last - 1);
  else if (to < last - 2) items.push('gap-end');
  items.push(last);
  return items;
}
