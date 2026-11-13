// Atajo de teclado del modo presentación (RF30): P sola y fuera de un campo de escritura.

/** input (incluido el slider), select, textarea o elemento editable. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable || ['', 'true', 'plaintext-only'].includes(target.getAttribute('contenteditable') ?? 'no');
}

export function isPresentationHotkey(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'target'>,
): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return false;
  return e.key.toLowerCase() === 'p' && !isTypingTarget(e.target);
}
