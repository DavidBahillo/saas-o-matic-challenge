// Preparación común de los tests del frontend: matchers de jest-dom, limpieza, localStorage limpio y <dialog> simulado.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom no implementa showModal/close de <dialog> (plan §5): se simulan solo en los tests.
const dialogProto = window.HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
dialogProto.showModal ??= function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
dialogProto.close ??= function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
