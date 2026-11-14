// Título de la pestaña por ruta (WIG): "<título> · SaaS-O-Matic".
import { useEffect } from 'react';

export const APP_NAME = 'SaaS-O-Matic';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
