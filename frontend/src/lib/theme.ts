// Tema claro/oscuro (RF29). Oscuro por defecto; claro solo si el valor guardado es exactamente "light".
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'som-theme';

export function readTheme(storage: Pick<Storage, 'getItem'> | undefined): Theme {
  try {
    return storage?.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function writeTheme(storage: Pick<Storage, 'setItem'> | undefined, theme: Theme): void {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    // Modo privado o almacenamiento bloqueado: el tema solo vale para esta sesión.
  }
}

export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.setAttribute('data-theme', theme);
}

/** localStorage del navegador, o undefined si el simple acceso lanza. */
export function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
