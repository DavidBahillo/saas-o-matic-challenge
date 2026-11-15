// Contenedor de un <select class="input"> que lleva el chevron único (máscara CSS en .select-shell::after). No añade semántica.
import type { ReactNode } from 'react';

export function SelectShell({ children }: { children: ReactNode }) {
  return <div className="select-shell">{children}</div>;
}
