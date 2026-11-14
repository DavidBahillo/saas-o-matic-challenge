// Buscador global (RF6, RF7, V2): texto local → espera de 300 ms → ?q= en la URL (D-P3).
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export const SEARCH_DELAY_MS = 300;
export const SEARCH_MAX_LENGTH = 100;

const INPUT_PROPS = {
  type: 'search',
  className: 'input search',
  name: 'q',
  autoComplete: 'off',
  spellCheck: false,
  'aria-label': 'Buscar clientes',
  placeholder: 'Empresa, NIF o email…',
  maxLength: SEARCH_MAX_LENGTH,
} as const;

export function SearchBox() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onList = pathname === '/';
  const urlQ = onList ? (params.get('q') ?? '') : '';
  const [text, setText] = useState(urlQ);
  const committed = useRef(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Si el q de la URL cambia desde fuera (borrar búsqueda, enlace, recarga), el campo se sincroniza.
  useEffect(() => {
    if (urlQ !== committed.current) {
      committed.current = urlQ;
      setText(urlQ);
    }
  }, [urlQ]);

  useEffect(() => () => { clearTimeout(timer.current); }, []);

  function commit(value: string) {
    const q = value.trim();
    if (!onList && q === '') return;
    committed.current = q;
    void navigate(q === '' ? '/' : `/?q=${encodeURIComponent(q)}`, { replace: onList });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { commit(value); }, SEARCH_DELAY_MS);
  }

  return (
    <input {...INPUT_PROPS} value={text} onChange={handleChange} />
  );
}
