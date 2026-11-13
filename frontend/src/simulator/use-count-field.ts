// Estado de un campo numérico (RF20, RF22): el texto escrito y el último valor válido.
import { useState } from 'react';
import { parseCountField } from '../lib/parse-count-field';

export interface CountField {
  text: string;
  /** Último valor válido: lo que usan la vista previa y el guardado. */
  value: number;
  error: string | undefined;
  onChange: (text: string) => void;
}

export function useCountField(initial: number, max: number): CountField {
  const [text, setText] = useState(String(initial));
  const [value, setValue] = useState(initial);
  const parsed = parseCountField(text, max);
  return {
    text,
    value,
    error: parsed.ok ? undefined : parsed.message,
    onChange: (next) => {
      setText(next);
      const result = parseCountField(next, max);
      if (result.ok) setValue(result.value);
    },
  };
}
