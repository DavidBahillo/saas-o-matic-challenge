// RF54: aria-valuetext del slider y nota cuando hay más usuarios que el máximo del control.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderDetail, setField, slider, waitForSimulator } from '../test/detail';

async function open(users: string) {
  renderDetail();
  await waitForSimulator();
  setField('Usuarios', users);
}
const NOTE = 'El control llega a 100; escribe más en el campo';

describe('slider de usuarios (RF54)', () => {
  it.each([
    ['1', '1 usuario'],
    ['10', '10 usuarios'],
  ])('con %s usuarios, aria-valuetext "%s" y sin nota', async (users, text) => {
    await open(users);
    expect(slider()).toHaveAttribute('aria-valuetext', text);
    expect(screen.queryByText(NOTE)).toBeNull();
    expect(slider()).not.toHaveAttribute('aria-describedby');
  });

  it('con 100 usuarios no hay nota', async () => {
    await open('100');
    expect(slider()).toHaveAttribute('aria-valuetext', '100 usuarios');
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('con 101 usuarios hay nota enlazada y el valuetext lo dice', async () => {
    await open('101');
    expect(slider()).toHaveAttribute('aria-valuetext', '101 usuarios (el control llega a 100)');
    expect(screen.getByText(NOTE)).toBeVisible();
    expect(slider()).toHaveAccessibleDescription(NOTE);
    expect(slider()).toHaveValue('100');
  });
});
