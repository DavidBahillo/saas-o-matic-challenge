// Preparación común de los tests del frontend: matchers de jest-dom, limpieza y localStorage limpio.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
