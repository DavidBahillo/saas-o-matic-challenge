// Selector de tema (RF-tema3, RF-tema4): dos botones con sol y luna, siempre visibles. Guarda som-theme y cambia data-theme.
import { useState } from 'react';
import { applyTheme, browserStorage, readTheme, writeTheme } from '../lib/theme';
import type { Theme } from '../lib/theme';
import { MoonIcon, SunIcon } from '../ui/icons';

function ThemeButton({ target, current, onPick }: { target: Theme; current: Theme; onPick: (theme: Theme) => void }) {
  const pressed = target === current;
  const classes = pressed ? 'theme-toggle__btn theme-toggle__btn--active' : 'theme-toggle__btn';
  return (
    <button
      type="button"
      className={classes}
      aria-pressed={pressed}
      aria-label={target === 'light' ? 'Tema claro' : 'Tema oscuro'}
      onClick={() => { onPick(target); }}
    >
      {target === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme(browserStorage()));

  function pick(next: Theme) {
    if (next === theme) return;
    writeTheme(browserStorage(), next);
    applyTheme(document.documentElement, next);
    setTheme(next);
  }

  return (
    <div role="group" aria-label="Tema" className="theme-toggle">
      <ThemeButton target="light" current={theme} onPick={pick} />
      <ThemeButton target="dark" current={theme} onPick={pick} />
    </div>
  );
}
