// RF47 (re-auditoría): salir por desmontar el detalle es silencioso; alternar o Escape no.
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PresentationProvider, usePresentation, usePresentationHotkeys } from './presentation-context';

let api: ReturnType<typeof usePresentation> | undefined;
function Probe() {
  api = usePresentation();
  return null;
}
function Detail() {
  usePresentationHotkeys();
  return null;
}
const current = () => {
  if (api === undefined) throw new Error('sin contexto');
  return api;
};

describe('salida silenciosa de la presentación', () => {
  it('desmontar el detalle activa la marca de silencio; alternar la borra', () => {
    const { rerender } = render(<PresentationProvider><Probe /><Detail /></PresentationProvider>);
    act(() => { current().toggle(); });
    expect(current().consumeSilent()).toBe(false);
    rerender(<PresentationProvider><Probe /></PresentationProvider>);
    expect(current().active).toBe(false);
    expect(current().consumeSilent()).toBe(true);
    expect(current().consumeSilent()).toBe(false);
  });

  it('exit (Escape) no es silencioso', () => {
    render(<PresentationProvider><Probe /></PresentationProvider>);
    act(() => { current().toggle(); });
    act(() => { current().exit(); });
    expect(current().consumeSilent()).toBe(false);
  });
});
