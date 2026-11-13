// Relojes falsos compatibles con Testing Library bajo Vitest: RTL solo avanza los temporizadores
// de `asyncWrapper` si existe un global `jest`, así que se simula con vi.
import { vi } from 'vitest';

export function useFakeClock(): void {
  vi.useFakeTimers();
  vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
}

export function useRealClock(): void {
  vi.unstubAllGlobals();
  vi.useRealTimers();
}
