// RF14: tooltip reutilizable (150 ms, Escape, aria-describedby, foco y ratón).
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFakeClock, useRealClock } from '../test/fake-timers';
import { Tooltip } from './Tooltip';

describe('Tooltip (RF14)', () => {
  beforeEach(useFakeClock);
  afterEach(useRealClock);

  const setup = () => {
    render(<Tooltip text="Ayuda"><button type="button">Ver</button></Tooltip>);
    return screen.getByRole('button', { name: 'Ver' });
  };

  it('con el ratón aparece a los 150 ms, enlaza aria-describedby y se oculta al salir', () => {
    const trigger = setup();
    fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(149));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Ayuda');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    fireEvent.mouseLeave(trigger.parentElement as HTMLElement);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('con el foco aparece y al desenfocar se oculta', () => {
    const trigger = setup();
    act(() => { trigger.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    expect(screen.getByRole('tooltip')).toBeVisible();
    act(() => { trigger.blur(); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('Escape lo cierra', () => {
    const trigger = setup();
    act(() => { trigger.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('salir antes de 150 ms cancela la aparición', () => {
    const trigger = setup();
    fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.mouseLeave(trigger.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('permanece mientras el ratón está sobre el propio tooltip', () => {
    const trigger = setup();
    fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(150));
    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip')).toBeVisible();
  });
});

describe('Tooltip: Escape y modos (RF48, RF50)', () => {
  beforeEach(useFakeClock);
  afterEach(useRealClock);

  it('Escape con el tooltip abierto lo cierra y no llega a window (no sale de la presentación)', () => {
    const onWindow = vi.fn();
    window.addEventListener('keydown', onWindow);
    render(<Tooltip text="Ayuda"><button type="button">Ver</button></Tooltip>);
    const trigger = screen.getByRole('button', { name: 'Ver' });
    act(() => { trigger.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(onWindow).not.toHaveBeenCalled();
    window.removeEventListener('keydown', onWindow);
  });

  it('con Escape y sin tooltip abierto el evento sigue su camino', () => {
    const onWindow = vi.fn();
    window.addEventListener('keydown', onWindow);
    render(<Tooltip text="Ayuda"><button type="button">Ver</button></Tooltip>);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onWindow).toHaveBeenCalledTimes(1);
    window.removeEventListener('keydown', onWindow);
  });

  it('enabled=false no muestra nunca la burbuja', () => {
    render(<Tooltip text="Ayuda" enabled={false}><button type="button">Ver</button></Tooltip>);
    act(() => { screen.getByRole('button', { name: 'Ver' }).focus(); });
    act(() => void vi.advanceTimersByTime(300));
    expect(document.querySelector('.tooltip__bubble')).toBeNull();
  });

  it('describe=false: sin aria-describedby y con la burbuja oculta a lectores', () => {
    render(<Tooltip text="Ayuda" describe={false}><button type="button">Ver</button></Tooltip>);
    const trigger = screen.getByRole('button', { name: 'Ver' });
    act(() => { trigger.focus(); });
    act(() => void vi.advanceTimersByTime(150));
    expect(trigger).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('.tooltip__bubble')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Tooltip: toggle (toque)', () => {
  beforeEach(useFakeClock);
  afterEach(useRealClock);

  it('con toggle, pulsar abre y vuelve a cerrar, y el disparador expone aria-expanded', () => {
    render(<Tooltip text="Ayuda" toggle><button type="button">Ver</button></Tooltip>);
    const trigger = screen.getByRole('button', { name: 'Ver' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(document.querySelector('.tooltip__bubble')).not.toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(document.querySelector('.tooltip__bubble')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('sin toggle no hay aria-expanded y pulsar no abre', () => {
    render(<Tooltip text="Ayuda"><button type="button">Ver</button></Tooltip>);
    const trigger = screen.getByRole('button', { name: 'Ver' });
    fireEvent.click(trigger);
    expect(trigger).not.toHaveAttribute('aria-expanded');
    expect(document.querySelector('.tooltip__bubble')).toBeNull();
  });

  it('con enabled=false pulsar no abre', () => {
    render(<Tooltip text="Ayuda" toggle enabled={false}><button type="button">Ver</button></Tooltip>);
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(document.querySelector('.tooltip__bubble')).toBeNull();
  });
});
