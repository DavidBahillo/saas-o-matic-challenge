// RF8 a RF15 y RF-aviso: botón, chip, campo, tarjeta, casilla, radio, tooltip, iconos, estados y bandera.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { CountryFlag } from './CountryFlag';
import { Field } from './Field';
import { Tooltip } from './Tooltip';
import { AlertIcon, ChevronIcon, InfoIcon, MoonIcon, PencilIcon, SunIcon, TrashIcon } from './icons';
import { Radio } from './Radio';
import { ErrorState, Skeleton } from './States';

describe('Button (RF8, RF9)', () => {
  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)('variante %s', (variant) => {
    render(<Button variant={variant}>Ir</Button>);
    expect(screen.getByRole('button', { name: 'Ir' })).toHaveClass('btn', `btn--${variant}`);
  });

  it.each(['sm', 'md', 'lg'] as const)('tamaño %s', (size) => {
    render(<Button size={size}>Ir</Button>);
    expect(screen.getByRole('button')).toHaveClass(`btn--${size}`);
  });

  it('por defecto es secundario y md', () => {
    render(<Button>Ir</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--secondary', 'btn--md');
  });

  it('deshabilitado nativo: no recibe foco ni clic', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={onClick}>Ir</Button>);
    await user.tab();
    expect(screen.getByRole('button')).not.toHaveFocus();
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aria-disabled conserva el foco', async () => {
    const user = userEvent.setup();
    render(<Button aria-disabled="true">Ir</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
  });
});

describe('Badge (RF12)', () => {
  it('neutro por defecto y con tonos de estado, sin cambiar el texto del DOM', () => {
    render(
      <>
        <Badge>starter</Badge>
        <Badge tone="success">ok</Badge>
        <Badge tone="warning">aviso</Badge>
        <Badge tone="error">fallo</Badge>
        <Badge tone="info">info</Badge>
      </>,
    );
    expect(screen.getByText('starter')).toHaveClass('badge', 'badge--neutral');
    for (const [text, tone] of [['ok', 'success'], ['aviso', 'warning'], ['fallo', 'error'], ['info', 'info']]) {
      expect(screen.getByText(text ?? '')).toHaveClass(`badge--${tone ?? ''}`);
    }
    expect(screen.getByText('starter').textContent).toBe('starter');
  });
});

describe('Field (RF10)', () => {
  it('hideLabel deja la etiqueta solo para lectores de pantalla', () => {
    render(<Field label="Usuarios" hideLabel>{(c) => <input {...c} />}</Field>);
    expect(screen.getByLabelText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toHaveClass('sr-only');
  });

  it('el error lleva icono además del texto y se enlaza con aria-describedby', () => {
    render(<Field label="Nombre" errors={['Obligatorio']}>{(c) => <input {...c} />}</Field>);
    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = document.getElementById(input.getAttribute('aria-describedby') ?? '');
    expect(error).toHaveTextContent('Obligatorio');
    expect(error?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('la región aria-live existe antes del error y sin error está vacía', () => {
    const { rerender } = render(<Field label="Nombre">{(c) => <input {...c} />}</Field>);
    const region = document.querySelector('.field__errors');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
    rerender(<Field label="Nombre" errors={['Obligatorio']}>{(c) => <input {...c} />}</Field>);
    expect(document.querySelector('.field__errors')).toBe(region);
    expect(region).toHaveTextContent('Obligatorio');
  });
});

describe('Card (RF11, RF15)', () => {
  it('por defecto, elevada y con cabecera', () => {
    render(
      <>
        <Card data-testid="a">uno</Card>
        <Card data-testid="b" elevated>dos</Card>
        <Card data-testid="c" header="Categoría">tres</Card>
      </>,
    );
    expect(screen.getByTestId('a')).toHaveClass('card');
    expect(screen.getByTestId('a')).not.toHaveClass('card--elevated');
    expect(screen.getByTestId('b')).toHaveClass('card--elevated');
    expect(screen.getByText('Categoría')).toHaveClass('card__header');
    expect(screen.getByTestId('a').querySelector('.card__header')).toBeNull();
  });
});

describe('Checkbox y Radio (RF15)', () => {
  it('la casilla se marca, se deshabilita y admite indeterminado', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Checkbox label="Acepto" />);
    const box = screen.getByRole('checkbox', { name: 'Acepto' });
    await user.click(box);
    expect(box).toBeChecked();
    rerender(<Checkbox label="Acepto" indeterminate />);
    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true);
    rerender(<Checkbox label="Acepto" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByText('Acepto').closest('label')).toHaveClass('check--disabled');
  });

  it('el radio selecciona uno del grupo y se deshabilita', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="plan" label="Starter" />
        <Radio name="plan" label="Growth" />
        <Radio name="plan" label="Enterprise" disabled />
      </>,
    );
    await user.click(screen.getByRole('radio', { name: 'Growth' }));
    expect(screen.getByRole('radio', { name: 'Growth' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Starter' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Enterprise' })).toBeDisabled();
  });
});

describe('icons (RF-tema4)', () => {
  it.each([SunIcon, MoonIcon, ChevronIcon, AlertIcon, InfoIcon, PencilIcon, TrashIcon])('es un SVG con currentColor y aria-hidden', (Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });
});

describe('estados y bandera (RF-estados, RF-bandera)', () => {
  it('el error lleva icono, mensaje y acción', () => {
    render(<ErrorState message="Falló" onRetry={() => undefined} />);
    expect(screen.getByText('Falló')).toBeVisible();
    expect(document.querySelector('.state--error svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });

  it('el esqueleto es visible y sus barras son decorativas', () => {
    render(<Skeleton lines={2} />);
    expect(screen.getByTestId('skeleton').querySelectorAll('.skeleton[aria-hidden="true"]')).toHaveLength(2);
  });

  it('si la bandera falla queda solo el ISO, sin imagen ni hueco', () => {
    const { container } = render(<CountryFlag code="ES" />);
    fireEvent.error(screen.getByRole('img'));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.country__flag')).toBeNull();
    expect(container.textContent).toBe('ES');
  });
});

describe('Tooltip: envoltorio (R2-3)', () => {
  it('acepta className y style sin perder la clase base', () => {
    render(<Tooltip text="Ayuda" className="extra" style={{ flexGrow: 3 }}><button type="button">Ver</button></Tooltip>);
    const wrap = screen.getByRole('button', { name: 'Ver' }).parentElement;
    expect(wrap).toHaveClass('tooltip', 'extra');
    expect(wrap).toHaveStyle({ flexGrow: '3' });
  });
});
