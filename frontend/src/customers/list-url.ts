// URL de la lista (RF3, RF5), retorno validado tras editar (D-7) y aviso del estado de navegación.

/** `/?q=…&page=…`: omite `page` si es 1 y `q` si está vacío. */
export function listUrl(q: string, page: number): string {
  const parts: string[] = [];
  if (q !== '') parts.push(`q=${encodeURIComponent(q)}`);
  if (page > 1) parts.push(`page=${String(page)}`);
  return parts.length === 0 ? '/' : `/?${parts.join('&')}`;
}

function field(state: unknown, key: string): unknown {
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>)[key] : undefined;
}

/** `state.from` solo si es una ruta interna (empieza por `/`, no por `//` ni `/\`); si no, `/`. */
export function safeFrom(state: unknown): string {
  const from = field(state, 'from');
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\') ? from : '/';
}

/** Aviso pasado en `state.notice` (texto) o cadena vacía. */
export function readNotice(state: unknown): string {
  const notice = field(state, 'notice');
  return typeof notice === 'string' ? notice : '';
}
