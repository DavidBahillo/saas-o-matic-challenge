// Almacén de snapshot (RF4, RF6, RF7): reloj y proveedor falsos, sin red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateProviderError } from './rate-provider';
import type { RateProvider, RawRates } from './rate-provider';
import { createSnapshotStore } from './snapshot-store';

const T0 = new Date('2026-11-13T10:00:00.000Z').getTime();
const DAY = 86_400_000;
const UNAVAILABLE = { status: 500, code: 'EXCHANGE_RATE_UNAVAILABLE' };

let clock: number;
let calls: number;
let answer: RawRates | Error;
let release: Promise<void> | undefined;

const provider: RateProvider = {
  async fetchRates() {
    calls += 1;
    await release;
    return answer instanceof Error ? Promise.reject(answer) : answer;
  },
};

const store = () => createSnapshotStore({ provider, now: () => new Date(clock) });

beforeEach(() => {
  clock = T0;
  calls = 0;
  answer = { USD: '1.1', CHF: '0.95' };
  release = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('snapshot-store · caché de 24 h (RF4)', () => {
  it('la primera lectura llama al proveedor y guarda el instante de recepción', async () => {
    const snapshot = await store().get();
    expect(snapshot.at).toEqual(new Date(T0));
    expect(snapshot.pairs.get('USD')).toBe(1_100_000);
    expect(calls).toBe(1);
  });

  it('usa la caché a 23 h 59 min 59,999 s', async () => {
    const s = store();
    await s.get();
    clock = T0 + DAY - 1;
    expect((await s.get()).at).toEqual(new Date(T0));
    expect(calls).toBe(1);
  });

  it('renueva a exactamente 24 h con el instante nuevo', async () => {
    const s = store();
    await s.get();
    answer = { USD: '1.2' };
    clock = T0 + DAY;
    const next = await s.get();
    expect(next.at).toEqual(new Date(T0 + DAY));
    expect(next.pairs.get('USD')).toBe(1_200_000);
    expect(calls).toBe(2);
  });

  it('renueva con antigüedad negativa (reloj hacia atrás)', async () => {
    const s = store();
    await s.get();
    clock = T0 - 3_600_000;
    await s.get();
    expect(calls).toBe(2);
  });

  it('una divisa ausente no provoca otra llamada mientras el snapshot sea vigente (PT4)', async () => {
    const s = store();
    expect((await s.get()).pairs.has('SEK')).toBe(false);
    await s.get();
    expect(calls).toBe(1);
  });

  it('las divisas inválidas no llegan a la caché y el resto sí', async () => {
    answer = { USD: '1e0', CHF: '0.95' };
    const { pairs } = await store().get();
    expect([...pairs.keys()]).toEqual(['CHF']);
  });
});

describe('snapshot-store · petición compartida (RF4)', () => {
  it('cinco lecturas simultáneas con la caché vacía hacen una sola llamada y comparten el snapshot', async () => {
    let open: () => void = () => undefined;
    release = new Promise<void>((resolve) => { open = resolve; });
    const s = store();
    const all = Promise.all([s.get(), s.get(), s.get(), s.get(), s.get()]);
    open();
    const snapshots = await all;
    expect(calls).toBe(1);
    for (const snapshot of snapshots) expect(snapshot).toBe(snapshots[0]);
  });

  it('cinco lecturas simultáneas con el proveedor caído hacen una llamada y todas fallan', async () => {
    answer = new RateProviderError('caída');
    const s = store();
    const results = await Promise.allSettled([s.get(), s.get(), s.get(), s.get(), s.get()]);
    expect(calls).toBe(1);
    for (const r of results) expect(r).toMatchObject({ status: 'rejected', reason: UNAVAILABLE });
  });
});

describe('snapshot-store · fallos y enfriamiento (RF6, RF7)', () => {
  it('con el proveedor caído da EXCHANGE_RATE_UNAVAILABLE y escribe la causa en el log', async () => {
    answer = new RateProviderError('causa interna');
    await expect(store().get()).rejects.toMatchObject(UNAVAILABLE);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('con el snapshot caducado y la API caída falla: nunca usa uno caducado', async () => {
    const s = store();
    await s.get();
    clock = T0 + DAY;
    answer = new RateProviderError('caída');
    await expect(s.get()).rejects.toMatchObject(UNAVAILABLE);
  });

  it('con cero divisas válidas da 500 y no guarda nada en caché', async () => {
    answer = { USD: '1e0', SEK: '0' };
    const s = store();
    await expect(s.get()).rejects.toMatchObject(UNAVAILABLE);
    clock = T0 + 61_000;
    answer = { USD: '1.1' };
    expect((await s.get()).pairs.get('USD')).toBe(1_100_000);
    expect(calls).toBe(2);
  });

  it('a los 30 s de un fallo responde 500 sin llamar al proveedor; a los 61 s vuelve a intentar', async () => {
    answer = new RateProviderError('caída');
    const s = store();
    await expect(s.get()).rejects.toMatchObject(UNAVAILABLE);
    clock = T0 + 30_000;
    await expect(s.get()).rejects.toMatchObject(UNAVAILABLE);
    expect(calls).toBe(1);
    clock = T0 + 61_000;
    answer = { USD: '1.1' };
    expect((await s.get()).at).toEqual(new Date(T0 + 61_000));
    expect(calls).toBe(2);
  });

  it('a exactamente 60 s del fallo ya vuelve a intentar', async () => {
    answer = new RateProviderError('caída');
    const s = store();
    await expect(s.get()).rejects.toBeDefined();
    clock = T0 + 60_000;
    await expect(s.get()).rejects.toBeDefined();
    expect(calls).toBe(2);
  });

  it('con el reloj hacia atrás tras un fallo no se activa el enfriamiento', async () => {
    answer = new RateProviderError('caída');
    const s = store();
    await expect(s.get()).rejects.toBeDefined();
    clock = T0 - 10_000;
    await expect(s.get()).rejects.toBeDefined();
    expect(calls).toBe(2);
  });

  it('un éxito tras el enfriamiento limpia el fallo', async () => {
    answer = new RateProviderError('caída');
    const s = store();
    await expect(s.get()).rejects.toBeDefined();
    clock = T0 + 61_000;
    answer = { USD: '1.1' };
    await s.get();
    clock = T0 + 61_000 + DAY;
    answer = { USD: '1.3' };
    expect((await s.get()).pairs.get('USD')).toBe(1_300_000);
  });
});
