// Iconos propios (spec 010, RF20, RF11): SVG en línea, decorativos y con currentColor; el chevron tiene una única geometría.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CHEVRON_PATH, CalendarIcon, ChevronIcon, GlobeIcon, IdCardIcon, MailIcon, SaveIcon,
} from './icons';

const ICONS = { SaveIcon, GlobeIcon, IdCardIcon, MailIcon, CalendarIcon, ChevronIcon };

describe('iconos de la spec 010', () => {
  it.each(Object.entries(ICONS))('%s es decorativo y usa currentColor', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('ChevronIcon dibuja CHEVRON_PATH, la fuente única de la geometría', () => {
    const { container } = render(<ChevronIcon />);
    expect(CHEVRON_PATH).toBe('m6 9 6 6 6-6');
    expect(container.querySelector('path')).toHaveAttribute('d', CHEVRON_PATH);
  });
});
