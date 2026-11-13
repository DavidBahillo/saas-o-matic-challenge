# SaaS-O-Matic Design System

Claro, analítico, persuasivo. Basado en InsightDeck y adaptado a un dashboard comercial en **modo oscuro por defecto**.

## Principios
- **Los números primero.** El total mensual es siempre el elemento más visible de la pantalla.
- **Calma oscura.** Fondos azul noche profundo, superficies elevadas por luminosidad (no por sombra) y acentos de color solo donde hay información.
- **Teal = acción y confianza.** Púrpura y rosa se reservan para insights y tendencias.

## Temas
El tema oscuro es el valor de `:root`. El claro se activa con `[data-theme="light"]` en `<html>`. La preferencia se guarda en `localStorage` (`som-theme`); si no hay ninguna guardada, **siempre oscuro**, sin depender de `prefers-color-scheme`.

## Tokens de color
| Token | Oscuro (por defecto) | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0B1120` | `#F8FAFC` | Fondo global |
| `--surface` | `#111827` | `#FFFFFF` | Tarjetas, paneles |
| `--surface-2` | `#1F2937` | `#F1F5F9` | Inputs, filas hover, pistas del slider |
| `--border` | `#243042` | `#E2E8F0` | Bordes de tarjetas y divisores |
| `--text` | `#E5E7EB` | `#0F172A` | Texto principal |
| `--text-muted` | `#94A3B8` | `#475569` | Etiquetas y metadatos |
| `--primary` | `#14B8A6` | `#0D9488` | Botones, slider, navegación activa, tramo 1 |
| `--primary-contrast` | `#042F2E` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `#A855F7` | `#9333EA` | Insights, tramo 2 |
| `--tertiary` | `#F472B6` | `#EC4899` | Tendencias, badges, tramo 3 |
| `--success` | `#34D399` | `#10B981` | Validación OK |
| `--warning` | `#FBBF24` | `#F59E0B` | Tipos de cambio desactualizados |
| `--error` | `#F87171` | `#EF4444` | Errores de validación o de la API |
| `--info` | `#60A5FA` | `#3B82F6` | Avisos neutros |

Los colores de oscuro son la versión aclarada (Tailwind 400) de los de InsightDeck, para mantener el contraste AA sobre `--bg`.

```css
:root {
  --bg:#0B1120; --surface:#111827; --surface-2:#1F2937; --border:#243042;
  --text:#E5E7EB; --text-muted:#94A3B8;
  --primary:#14B8A6; --primary-contrast:#042F2E; --secondary:#A855F7; --tertiary:#F472B6;
  --success:#34D399; --warning:#FBBF24; --error:#F87171; --info:#60A5FA;
  color-scheme: dark;
}
[data-theme="light"] {
  --bg:#F8FAFC; --surface:#FFFFFF; --surface-2:#F1F5F9; --border:#E2E8F0;
  --text:#0F172A; --text-muted:#475569;
  --primary:#0D9488; --primary-contrast:#FFFFFF; --secondary:#9333EA; --tertiary:#EC4899;
  --success:#10B981; --warning:#F59E0B; --error:#EF4444; --info:#3B82F6;
  color-scheme: light;
}
```

## Tipografía
- Familia: **Inter** (Google Fonts), con `system-ui` como respaldo.
- Importes: `font-variant-numeric: tabular-nums` para que no bailen al mover el slider.
- Escala: 12 / 14 (cuerpo) / 16 / 20 / 24 / 32 / 48 (total del simulador). Pesos 400, 500 y 600.

## Espaciado, radios y elevación
- Escala base de 4 px: 4, 8, 12, 16, 24, 32, 48.
- Radios: 6 en inputs y badges, 12 en tarjetas, 999 en el slider y los chips.
- Elevación en oscuro: subir un nivel de superficie (`--surface` → `--surface-2`) más un borde de 1 px; sin sombras. En claro: `0 1px 3px rgb(15 23 42 / .08)`.

## Layout y breakpoints
- `sm` 640, `md` 1024, `lg` 1280. Ancho máximo de contenido: 1200 px. Margen lateral de 16 px en móvil.
- Rejilla de tarjetas: 1 columna en móvil, 2 en `sm` y 3 en `md` o más.
- Sin scroll horizontal desde 360 px.

## Componentes
- **Header:** logo, buscador global, selector de divisa e interruptor de tema.
- **Tarjeta de cliente:** empresa (16/600), NIF con la bandera del país y su código ISO, email, chip con el plan y el número de simulaciones.
- **Bandera de país:** imagen de `flagcdn.com` (`w20`, y `w40` a 2x) de 20 × 15 px reservados, con `loading="lazy"`, contorno de 1 px en `--border` y `alt` con el nombre del país en español; el código ISO va siempre visible a su lado. Si la imagen falla (evento `error`) queda solo el código, sin icono roto.
- **Tarjeta de KPI:** etiqueta `--text-muted` 12, valor 32 tabular, delta opcional en `--tertiary`.
- **Slider de usuarios:** pista `--surface-2`, relleno `--primary` y marcas en 10 y 50 (límites entre tramos). Debe funcionar con teclado.
- **Desglose por tramos:** barra apilada con los tramos 1, 2 y 3 en `--primary`, `--secondary` y `--tertiary` (máximo 3 colores, más el IVA en `--text-muted`), seguida de una tabla con unidades × precio = subtotal.
- **Selector de divisa:** select con las 23 divisas de `shared/` (EUR primero: EUR, USD, GBP, CHF, SEK, NOK, DKK, PLN, CZK, CAD, AUD, NZD, MXN, BRL, RON, HKD, SGD, CNY, ILS, ZAR, TRY, THB y AED), cada una con código y nombre en español; las que no traen tipo salen deshabilitadas. Pie con "Tipos actualizados: hh:mm" y, junto a él, el enlace "Tipos de cambio por ExchangeRate-API" (atribución exigida, también en modo presentación), subrayado con `--primary`.
- **Estados:**
  - Carga: skeleton en `--surface-2` con pulso.
  - Error: borde `--error`, mensaje y botón "Reintentar".
  - Vacío: ilustración simple y una llamada a la acción.
  - Si fallan todos los tipos, se vuelve a EUR con un badge `--warning`; si falla solo una divisa, solo esa opción se deshabilita.
- **Modo presentación:** oculta el header y las listas y deja solo el simulador a pantalla completa (tecla `P` o botón).

## Gráficos
- Cada gráfico lleva título y subtítulo que explican lo que muestra (por ejemplo, "Coste mensual: 140 € · el 71 % sale del tramo 1").
- Nunca más de 5 colores por gráfico.
- Las etiquetas de valor van directamente sobre el dato y la leyenda solo aparece cuando hay más de 2 series.

## Accesibilidad
- Contraste AA en ambos temas, anillo de foco de 2 px en `--primary` con 2 px de offset y áreas táctiles de 44 px como mínimo.
- El color nunca es el único portador de información: los tramos llevan además una etiqueta de texto.
- Se respeta `prefers-reduced-motion`.
- Reglas de uso para el contraste AA en claro: el texto sobre `--primary` y `--tertiary` usa `--text` (en oscuro, `--primary-contrast` y `--bg`); los estados (`--warning`, `--error`, `--info`, `--success`) se usan como borde, punto o franja y nunca como color de texto; los enlaces van en `--text` subrayados con `--primary`.

## Qué hacer y qué no
- ✅ Usar solo tokens; ✅ mostrar siempre la divisa activa junto a cada importe; ✅ dar un título que explique cada gráfico.
- ❌ Colores escritos a mano; ❌ sombras en modo oscuro; ❌ más de 5 colores en un gráfico; ❌ importes sin `tabular-nums`.
