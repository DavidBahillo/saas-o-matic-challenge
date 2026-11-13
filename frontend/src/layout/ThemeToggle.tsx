// Interruptor de tema (RF29): guarda som-theme y cambia data-theme de <html>.
import { useState } from 'react';
import { applyTheme, browserStorage, readTheme, writeTheme } from '../lib/theme';
import type { Theme } from '../lib/theme';
import { Button } from '../ui/Button';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme(browserStorage()));

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    writeTheme(browserStorage(), next);
    applyTheme(document.documentElement, next);
    setTheme(next);
  }

  return (
    <Button onClick={toggle} aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
      {theme === 'dark' ? 'Claro' : 'Oscuro'}
    </Button>
  );
}
