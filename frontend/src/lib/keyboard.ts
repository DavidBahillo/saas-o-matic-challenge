// Atajo de teclado del modo presentación (RF48): Alt+P por `code` (en Mac, Option+P produce otro carácter) y fuera de un campo de texto (en el slider o un select no se escribe nada, así que ahí sí actúa).

const NON_TEXT_INPUTS = ['range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'color', 'image'];

/** Campo donde se escribe texto: textarea, elemento editable o input de texto (no el slider, casillas ni select). */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === 'TEXTAREA') return true;
  if (target.tagName === 'INPUT') return !NON_TEXT_INPUTS.includes((target as HTMLInputElement).type);
  return target.isContentEditable || ['', 'true', 'plaintext-only'].includes(target.getAttribute('contenteditable') ?? 'no');
}

export function isPresentationHotkey(
  e: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'target'>,
): boolean {
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
  return e.code === 'KeyP' && !isTextEntryTarget(e.target);
}
