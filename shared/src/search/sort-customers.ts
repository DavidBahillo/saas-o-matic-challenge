// Orden de clientes por nombre con la colación del español (RF24, plan §6.1): sin distinguir
// mayúsculas ni tildes (Á con A), Ñ como letra propia después de N y desempate por id
// ascendente para que el orden sea siempre determinista.
export interface Named {
  companyName: string;
  id: number;
}

// Se crea una sola vez: construir un Intl.Collator por comparación es caro.
const COLLATOR = new Intl.Collator('es', { sensitivity: 'base', usage: 'sort' });

export function compareByNameEs(a: Named, b: Named): number {
  return COLLATOR.compare(a.companyName, b.companyName) || a.id - b.id;
}

/** Devuelve una copia ordenada; no modifica la entrada. */
export function sortByNameEs<T extends Named>(items: readonly T[]): T[] {
  return [...items].sort(compareByNameEs);
}
