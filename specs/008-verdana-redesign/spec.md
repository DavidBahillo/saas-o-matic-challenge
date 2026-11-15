# 008 · Rediseño visual y de composición con el sistema Verdana Health
Estado: cerrada (validada)

> **Enmendada por la 009:** los botones "Editar" y "Borrar" de la lista (RF64 a RF67, "Próximamente") pasan a estar activos y la lista se pagina (ver `specs/009-customers-crud-pagination/spec.md`).

> **Enmendada por la 010 (auditoría de diseño UI):** RF12 (los chips de plan dejan de ser neutros y llevan color propio), RF19 (lista con País y NIF separados, solo el número en Simulaciones y botones y paginación con fondo), RF21/RF40 (plan junto al nombre y datos con icono), RF30 (el formulario va en tarjeta, sin grupos "Empresa" y "Contacto y plan"), RF39 (la flecha de los `select` es el chevron único) y RF48 (el botón pasa a "Presentar" con el atajo en un tooltip; el atajo sigue siendo Alt+P). Ver `specs/010-ui-design-audit/spec.md`.

## Contexto y objetivo (por qué)
`DESIGN.md` se ha sustituido por completo por el sistema Verdana Health (navy + sage, Plus Jakarta Sans / DM Sans / Fira Code, base de 8 px, radio 8 px, sombras difusas). Es la nueva fuente de verdad visual. El frontend actual usa la paleta anterior (turquesa, púrpura y rosa, radios de 6 y 12 px, sin sombras), carga Inter y presenta todo como tarjetas iguales y un simulador apilado, sin jerarquía clara.

El objetivo tiene dos partes: (1) aplicar el sistema visual y (2) rediseñar la composición y la jerarquía de cada pantalla para que lo importante (cuántos usuarios, por qué baja el precio por tramo y el presupuesto) sea lo más visible y el resto quede en calma. Se mantiene TODA la funcionalidad y no se añade ninguna función nueva: solo cambian la disposición, la jerarquía y algunos textos de interfaz. La dirección de composición está aprobada sobre `specs/008-verdana-redesign/mockup.html` (referencia visual, no código de la app; los valores finales los fija el Anexo A y esta spec). Después se auditará con web-design-guidelines.

### Decisiones del usuario incorporadas
- D-U1 Tema: oscuro por defecto, derivado de la referencia "Dark" de designmd.ai (valores aproximados muestreados; no es una especificación oficial), con el claro de Verdana como alternativo. Se conservan el interruptor y `som-theme`. El principio 9 de la constitución no cambia.
- D-U2 Tramos: navy / sage / info (en oscuro, el tramo 1 usa azul acero), siempre con nombre de texto (visible en el segmento si cabe; si no, para lectores y en la tabla, ronda 2). Slider y selector: navy para el control (azul acero en oscuro) y sage para foco y selección.
- D-U3 Fuentes: Google Fonts por CDN, sin dependencias nuevas, con respaldo `system-ui`. El usuario acepta de forma explícita que el navegador llame a Google (IP visible) por ser una herramienta interna; se registra en `MEMORY.md`.
- D-U4 Contraste: se añaden tokens de texto accesibles y los colores originales de Verdana quedan para rellenos y bordes. No se cambia ningún valor original: solo se añaden tokens nuevos.
- D-U5 `DESIGN.md`: se adapta el texto descriptivo a SaaS-O-Matic y se añade un único bloque ```css con TODOS los tokens (claro, oscuro, texto accesible) como fuente única; el test `design-tokens` que compara ese bloque con el archivo de tokens se mantiene.
- D-U6 Se implementa TODO el sistema de componentes (tooltips, botón destructivo, casillas, radios, tarjeta con cabecera) como componentes reutilizables, aunque hoy no se usen.
- D-U7 Composición: la dirección del mockup aprobado. Ya no rige la regla de "misma estructura y contenido": cambian la disposición y la jerarquía, no las funciones.
- D-U8 La atribución "Tipos de cambio por ExchangeRate-API" se QUITA (se comentó a propósito). Deroga el RF12 de la spec 007; se registra en `MEMORY.md`. Se eliminan el requisito, el componente de atribución, sus tests y la mención en `DESIGN.md`.
- D-U9 Modo presentación: muestra solo la escalera con el slider y la hoja de presupuesto, ampliadas por 1,25.

### Decisiones propuestas por el planner (el usuario las valida al aprobar)
- Controles interactivos conservan 44 px mínimos (decisión 005); el tamaño md de `DESIGN.md` (42 px) pasa a 44 px y sm (32 px) solo existe como componente. Los campos de texto usan 16 px (Body).
- Los chips de plan (starter/growth/enterprise) son informativos y usan la variante neutra; los de estado usan éxito, aviso, error e info.
- No hay estilo `:visited` distinto ni `theme-color` en `index.html`.
- El selector de divisa sigue siendo un `<select>` nativo: su lista la dibuja el navegador; solo se estilan el control cerrado, `color-scheme` y los colores de `option`.
- La columna "Última simulación" del mockup no se puede dar sin cambiar la API; el usuario decide "Alta" (fecha de alta), sin tocar `backend/` ni `shared/`.
- El total grande de la hoja va SIEMPRE en EUR (decisión del usuario), igual que la barra y la tabla (D16); con divisa distinta de EUR, la vista previa convertida existente (función compartida, sin valor ni persistencia) se muestra debajo de base e IVA.
- El relleno de la pista del slider usa `--color-action` (no sage), para que el color de los tramos solo lo lleve la escalera.

## Anexo A · Sistema de tokens (cerrado)
Todos los tokens viven en un único bloque ```css de `DESIGN.md`, que se copia idéntico al archivo de tokens del frontend (`:root` = oscuro, `[data-theme="light"]` = claro). Los valores de contraste se han calculado a mano; el test de contraste (RF31) es la autoridad: si un par no alcanza su umbral, se ajusta solo la luminosidad del token y se anota en `MEMORY.md`.

### A1 · Esquema de nombres y equivalencias con los tokens antiguos
Prefijos: `--color-*`, `--font-*`, `--fs-*` (tamaño), `--lh-*` (interlineado), `--space-*`, `--radius-*`, `--shadow-*`. Los tokens antiguos desaparecen.
| Antiguo | Nuevo |
|---|---|
| `--bg`, `--surface`, `--surface-2` | `--color-bg`, `--color-surface`, `--color-surface-2` |
| `--border` | `--color-border` (divisores y bordes decorativos); bordes de controles: `--color-border-control` (nuevo) |
| `--text`, `--text-muted` | `--color-text`, `--color-text-muted` |
| `--primary`, `--primary-contrast` | `--color-action`, `--color-on-action` (botón primario, slider, selector); subrayados, foco y enlaces que usaban `--primary` pasan a `--color-sage-text` y `--color-focus` |
| `--secondary`, `--tertiary` | `--color-chart-2`, `--color-chart-3` (solo tramos 2 y 3) |
| `--success`, `--warning`, `--error`, `--info` | mismos nombres con prefijo `--color-` (relleno y borde) y `--color-*-text` (texto) |
| `--text-muted` como relleno del segmento de IVA | `--color-chart-vat` |

### A2 · Colores (claro / oscuro)
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--color-bg` | #F8FAFC | #0B1120 | fondo de página |
| `--color-surface` | #FFFFFF | #151B30 | tarjetas, cabecera, hoja de presupuesto |
| `--color-surface-2` | #F1F5F9 | #1E2640 | campos deshabilitados, ghost hover, esqueleto, escalón no alcanzado |
| `--color-border` | #E2E8F0 | #2B3550 | divisores y bordes de tarjeta |
| `--color-border-control` | #64748B | #6B7796 | borde de campos, casillas, radios, pista del slider |
| `--color-text` | #0F172A | #D8E0F8 | texto principal |
| `--color-text-muted` | #475569 | #A3AECB | texto secundario |
| `--color-action` | #0F172A | #487898 | botón primario, thumb y relleno del slider, borde del selector |
| `--color-action-hover` | #020617 | #3A6683 | hover y pulsado del primario |
| `--color-on-action` | #FFFFFF | #FFFFFF | texto sobre `--color-action` |
| `--color-sage` | #059669 | #68D8A8 | relleno (tramo 2, selección, indicador de navegación) |
| `--color-on-sage` | #0F172A | #0B1120 | texto sobre `--color-sage` |
| `--color-sage-text` | #047857 | #68D8A8 | enlaces, acentos de texto |
| `--color-sage-text-hover` | #065F46 | #8FE5C0 | hover de enlaces |
| `--color-info` / `-text` | #0EA5E9 / #0369A1 | #78D0F8 / #78D0F8 | relleno-borde / texto |
| `--color-success` / `-text` | #22C55E / #166534 | #4ADE80 / #86EFAC | idem |
| `--color-warning` / `-text` | #EAB308 / #854D0E | #FACC15 / #FDE047 | idem |
| `--color-error` / `-text` | #EF4444 / #B91C1C | #F87171 / #FCA5A5 | idem |
| `--color-error-strong` | #DC2626 | #DC2626 | relleno del botón destructivo (texto blanco) |
| `--color-error-strong-hover` | #B91C1C | #B91C1C | hover del destructivo |
| `--color-on-error-strong` | #FFFFFF | #FFFFFF | texto del destructivo |
| `--color-success-bg`, `-warning-bg`, `-error-bg`, `-info-bg` | #22C55E15, #EAB30815, #EF444415, #0EA5E915 | #4ADE8024, #FACC1524, #F8717124, #78D0F824 | fondo de chips y avisos |
| `--color-hover` | #F8FAFC | #1A2240 | fila y tarjeta en hover |
| `--color-active` | #0F172A06 | #FFFFFF0A | fila pulsada |
| `--color-ghost-hover` | #F1F5F9 | #1E2640 | botón fantasma en hover |
| `--color-secondary-hover` | #0F172A0A | #FFFFFF0F | botón secundario en hover |
| `--color-focus` | #047857 | #68D8A8 | contorno de foco |
| `--color-focus-ring` | #04785333 | #68D8A840 | anillo decorativo de 3 px en campos (el borde de 2 px lleva el contraste) |
| `--color-selection` | #05966933 | #68D8A840 | `::selection` |
| `--color-chart-1` | #0F172A | #487898 | tramo 1 |
| `--color-chart-2` | #059669 | #68D8A8 | tramo 2 |
| `--color-chart-3` | #0A9BDC | #78D0F8 | tramo 3 (en claro, más oscuro que info para llegar a 3:1) |
| `--color-chart-vat` | #475569 | #A3AECB | segmento de IVA |
| `--color-on-chart-1` | #FFFFFF | #FFFFFF | texto sobre el tramo 1 |
| `--color-on-chart-2` | #0F172A | #0B1120 | texto sobre el tramo 2 |
| `--color-on-chart-3` | #0F172A | #0B1120 | texto sobre el tramo 3 |
| `--color-on-chart-vat` | #FFFFFF | #0B1120 | texto sobre el IVA |
| `--color-tooltip-bg` / `-text` | #0F172A / #F8FAFC | #D8E0F8 / #0B1120 | tooltip |

Elevación en oscuro: el relieve se logra con luminosidad (superficie más clara que el fondo) y borde, no con sombras. `--color-surface-2` más borde `--color-border` es la tarjeta elevada.

### A3 · Tipografía, espaciado, radios y sombras
- Familias: `--font-head` = Plus Jakarta Sans, system-ui, sans-serif; `--font-body` = DM Sans, system-ui, sans-serif; `--font-mono` = Fira Code, ui-monospace, Consolas, monospace.
- Escala (`--fs-*` y `--lh-*`): display 40/1.15, h1 32/1.2, h2 24/1.25, h3 20/1.3, h4 16/1.35, body-lg 18/1.6, body 16/1.6, body-sm 14/1.5, caption 12/1.4, code 14/1.6. Tamaños de cifra destacada: cifra de usuarios 48, total del presupuesto 64 (ver A4).
- Espaciado (`--space-*`): xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48, 3xl 64. El valor de 12 px desaparece (pasa a 8 o 16 según el caso). Únicas excepciones: los rellenos propios de componentes que `DESIGN.md` fija (6, 10, 14, 22 y 28 px) y los 4 px de las celdas de tabla a 480 px o menos.
- Radios: `--radius-sm` 4, `--radius` 8, `--radius-md` 12, `--radius-lg` 16 (hoja de presupuesto), `--radius-full` 9999 px.
- Sombras claro: sm `0 1px 3px #0F172A08`, DEFAULT `0 2px 6px #0F172A0D`, md `0 4px 16px #0F172A12`, lg `0 8px 32px #0F172A1A`. Oscuro: sm y DEFAULT `none`, md `0 4px 16px #0000004D`, lg `0 8px 32px #00000066`.

### A4 · Asignación tipográfica por elemento
| Elemento | Estilo |
|---|---|
| Título de página (nombre de cliente, "Clientes", "Nuevo cliente") | h1 (32 px, 700) desde 640 px; h2 (24 px, 600) por debajo |
| Marca | h3 (20 px, 600) |
| Título de sección ("¿Cuántos usuarios?", "Simulaciones guardadas") | h3 (20 px, 600) |
| Título de la hoja ("Presupuesto mensual") | h4 (16 px, 500) |
| Nombre de empresa en la lista | h4 (16 px, 500) |
| Texto base, valores de campos | body (16 px, DM Sans 400) |
| Tablas, ayudas, notas, base e IVA bajo el total, botones sm y md | body-sm (14 px); botón lg: 16 px |
| Etiquetas de campo | 14 px, 500; ayuda y error: 12 px |
| Chips, marcas del slider, textos de la escalera, etiquetas de la barra, cabeceras de columna | caption (12 px, 500) |
| Cifra de usuarios | Fira Code 600, 48 px, interlineado 1 |
| Total del presupuesto | Fira Code 600, 64 px en escritorio, interlineado 1; se reduce con el ancho de la hoja hasta 28 px para que cualquier importe de hasta 13 caracteres quepa sin cortarse |
| Importes, tipos de cambio, porcentajes, cifras y marcas del slider, valor de los campos numéricos, identificadores fiscales, número de simulaciones, precios y etiquetas de la barra | Fira Code (`--font-mono`) con `font-variant-numeric: tabular-nums` |
| Fechas, nombres, correos, textos | DM Sans |

### A5 · Pesos de Google Fonts (cierre)
Una sola petición `css2` con `display=swap`, precedida de `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`: Plus Jakarta Sans 500, 600 y 700; DM Sans 400 y 500; Fira Code 400 y 600. `strong` y `b` usan 500. Se elimina Inter.

## Requisitos funcionales (EARS)
Tokens, fuentes y fuente única
- RF1: CUANDO se carga la aplicación, el sistema DEBERÁ definir color, tipografía, espaciado, radios y sombras únicamente con los tokens del Anexo A, sustituyendo los antiguos según la tabla A1.
- RF2: CUANDO se complete el rediseño, `DESIGN.md` DEBERÁ contener un único bloque ```css con todos los tokens (claro, oscuro y texto accesible), idéntico al archivo de tokens del frontend, y el test que los compara DEBERÁ seguir en verde.
- RF3: SI un archivo del frontend (CSS, TSX o `index.html`) usa un color, una sombra, un radio o una familia tipográfica sin token, ENTONCES el test de tokens DEBERÁ fallar; la detección cubre hexadecimales, `rgb/hsl/oklch`, nombres de color, `box-shadow`, `border-radius` y `font-family` literales y estilos en línea, salvo `transparent`, `currentColor` y colores de sistema dentro de `forced-colors`.
- RF4: CUANDO se coloca un elemento, el sistema DEBERÁ usar la escala de espaciado (sin 12 px) y los radios del Anexo A; un test DEBERÁ rechazar valores de `padding`, `margin` y `gap` fuera de la escala y de las excepciones del Anexo A3.
- RF5: CUANDO se renderiza texto, el sistema DEBERÁ aplicar la asignación tipográfica del Anexo A4, con Plus Jakarta Sans en títulos, DM Sans en cuerpo y Fira Code en las cifras indicadas.
- RF6: CUANDO se carga la aplicación, el sistema DEBERÁ cargar las fuentes con los pesos de A5 desde Google Fonts con `display=swap` y `preconnect`, y quitar Inter.
- RF7: SI las fuentes web no cargan, ENTONCES el sistema DEBERÁ usar `system-ui` y una monoespaciada del sistema para las cifras, sin bloquear el pintado.

Componentes
- RF8: CUANDO se muestra un botón, el sistema DEBERÁ ofrecer las variantes primaria, secundaria, fantasma y destructiva y los tamaños sm, md y lg, con md de 44 px; el primario usa `--color-action`, el secundario `--color-border-control` y `--color-text`, el fantasma `--color-text-muted` y el destructivo `--color-error-strong`.
- RF9: MIENTRAS un botón o campo esté deshabilitado de forma nativa, el sistema DEBERÁ mostrarlo al 40 % de opacidad, con cursor de no permitido y sin efectos de hover; los elementos con `aria-disabled` DEBERÁN mantener visible el anillo de foco.
- RF10: CUANDO se muestra un campo (texto, número, búsqueda, país, plan, divisa), el sistema DEBERÁ aplicar los estados por defecto, hover, foco, error y deshabilitado: borde `--color-border-control`; foco con borde de 2 px `--color-focus` y anillo `--color-focus-ring`; error con borde de 2 px `--color-error`, texto `--color-error-text` e icono o prefijo textual (no solo color).
- RF11: CUANDO se muestra una tarjeta o una hoja, el sistema DEBERÁ usar la variante por defecto (borde `--color-border`) o elevada (sombra md en claro; superficie y borde en oscuro), con relleno de 24 px y radio de 8 px (la hoja de presupuesto, 32 px y radio 16 px en escritorio y 24 px en móvil).
- RF12: CUANDO se muestra una etiqueta, el sistema DEBERÁ usar el chip de `DESIGN.md` (4 px de radio, 12 px, 500, tracking 0,5 px, mayúsculas solo con CSS, sin cambiar el texto del DOM): neutro para el plan y la divisa, y éxito, aviso, error o info para los estados, con texto `--color-*-text` sobre `--color-*-bg`.
- RF13: CUANDO se muestran filas de lista (clientes, simulaciones guardadas), el sistema DEBERÁ usarlas con 48 px como mínimo, divisor `--color-border`, hover `--color-hover` con borde visible y pulsado `--color-active`.
- RF14: CUANDO el usuario pase el ratón o el foco por un elemento con ayuda, el sistema DEBERÁ mostrar un tooltip reutilizable (150 ms al mostrar, 0 ms al ocultar, máximo 240 px, `role="tooltip"` enlazado con `aria-describedby`, se cierra con Escape y permanece al pasar el ratón sobre él); sustituirá los `title=` de la barra; en la barra de tramos, los segmentos con texto abreviado o sin texto visible DEBERÁN poder enfocarse con teclado y mostrar con este tooltip su nombre completo ("Tramo 3", "IVA 21 %") al pasar el ratón o al recibir el foco (ronda 2, ver RF41).
- RF15: CUANDO se muestren casillas, radios o la tarjeta con cabecera, el sistema DEBERÁ ofrecerlos como componentes reutilizables con los estados de `DESIGN.md` y borde `--color-border-control`; los componentes sin uso actual (destructivo, casillas, radios, tarjeta con cabecera) DEBERÁN tener tests unitarios propios.
- RF16: CUANDO se muestra un enlace, el sistema DEBERÁ pintarlo con `--color-sage-text` y subrayado de 2 px, con `--color-sage-text-hover` y subrayado de 3 px en hover, sin estilo de visitado; `::selection` DEBERÁ usar `--color-selection`.

Composición por pantalla (dirección del mockup aprobado)
- RF17: CUANDO se muestre cualquier pantalla, el sistema DEBERÁ conservar todas sus funciones y datos actuales (sin funciones nuevas), pudiendo cambiar su disposición, su jerarquía y los textos de interfaz que fijan los RF18 a RF30.
- RF18 (cabecera): CUANDO se muestre la cabecera, el sistema DEBERÁ mostrar la marca, la navegación con "Clientes" y un indicador activo (subrayado de 2 px `--color-sage` más `aria-current="page"` solo en la ruta exacta, no solo color), el selector de divisa compacto (etiqueta "Divisa" y código visibles) y el selector de tema de dos iconos (RF-tema4); SI los tipos de cambio no están disponibles, ENTONCES el aviso con "Reintentar" DEBERÁ aparecer bajo la cabecera con el estilo de RF-aviso.
- RF19 (lista de clientes): CUANDO se muestre la lista de clientes, el sistema DEBERÁ mostrar una lista densa con cabecera de columnas (empresa con correo, país con NIF, plan, número de simulaciones y fecha de alta), filas de 64 px como mínimo enlazadas al detalle (toda la fila clicable, con un único enlace accesible), y en menos de 768 px cada fila apilada y sin cabecera de columnas.
- RF20 (cabecera de la lista) [modificado en la ronda 4, ver RF56]: CUANDO se muestre la lista, el sistema DEBERÁ mostrar el H1 "Clientes" con el contador de clientes junto a él ("N clientes", "1 cliente"), el buscador (con su comportamiento actual) y el botón "Nuevo cliente" en la cabecera de la lista, y el buscador DEJARÁ de estar en la cabecera global.
- RF21 (contexto del detalle) [modificado en la ronda 2, ver RF40]: CUANDO se muestre el detalle de un cliente, el sistema DEBERÁ mostrar una cabecera con el nombre (h1), los datos del cliente (bandera, ISO y NIF, correo, chip de plan, "Cliente desde {fecha}") y el botón de modo presentación.
- RF22 (espacio de trabajo): CUANDO se muestre el detalle en 1024 px o más, el sistema DEBERÁ colocar bajo la línea de contexto dos columnas (configuración 5/12, presupuesto 7/12, separadas 48 px); por debajo de 1024 px, una columna con el presupuesto debajo de la configuración de usuarios, y el orden del DOM DEBERÁ coincidir con el visual.
- RF23 (configuración de usuarios): CUANDO se muestre la columna de configuración, el sistema DEBERÁ mostrar el título "¿Cuántos usuarios?", el campo numérico de usuarios con la cifra grande (Fira Code 48), la escalera de tramos encima del slider, el slider con marcas 10 y 50 y las teclas actuales (flechas, Inicio, Fin, Re Pág, Av Pág), y el texto explicativo del cálculo con los valores actuales.
- RF24 (escalera de tramos) [modificado en la ronda 3, ver RF43]: CUANDO se muestre la escalera, el sistema DEBERÁ dibujar tres cuadros del mismo ancho y del mismo alto, con los colores `--color-chart-1/2/3`, y el precio por usuario y el rango en texto dentro de cada cuadro (como lista accesible con nombre "Precio por usuario según tramo", sin anuncios al mover el slider); SI un tramo no se ha alcanzado, ENTONCES DEBERÁ atenuarse con fondo `--color-surface-2`, borde discontinuo de 1 px del color del tramo y texto `--color-text-muted`, más un texto solo para lectores ("no alcanzado"), nunca bajando la opacidad del texto.
- RF25 (leyenda de escalones estrechos) [RETIRADO en la ronda 3, ver RF43]: ya no existe la leyenda bajo las marcas del slider; todo el texto va dentro de cada cuadro. La barra de tramos de la hoja tampoco tiene etiquetas exteriores (RF41).
- RF26 (explicación): CUANDO cambie el número de usuarios, el texto explicativo DEBERÁ describir cuántos usuarios caen en cada tramo con sus precios, con los datos del desglose compartido y sin cálculos nuevos (por ejemplo, "Con 23 usuarios pagas 10 al precio del tramo 1 y 13 al del tramo 2"); con 0 usuarios DEBERÁ decir que el importe es 0.
- RF27 (recursos): CUANDO se muestren el almacenamiento y las llamadas a la API, el sistema DEBERÁ agruparlos en un `<details>` "Recursos que no suman al precio", abierto por defecto, que SI un campo contiene un error ENTONCES permanece abierto con el error visible.
- RF28 (hoja de presupuesto) [modificado en la ronda 4, ver RF45: título "Presupuesto"; ya no hay "IVA incluido", hora de tipos ni línea de base e IVA bajo el total; la vista previa convertida va bajo el total]: CUANDO se muestre la hoja "Presupuesto mensual", el sistema DEBERÁ mostrar en una superficie con borde y radio 16: la divisa (chip) y la hora de tipos ("IVA incluido · tipos actualizados HH:MM" cuando haya hora), el total grande siempre en EUR (Fira Code 600, 64 px en escritorio), base e IVA bajo él, la vista previa convertida debajo cuando la divisa elegida no sea EUR, la barra de tramos, un subtítulo de porcentajes ("El 49 % sale del tramo 1 y el 51 % del tramo 2"), la tabla del desglose y un pie con la nota de la divisa de guardado y el botón "Guardar simulación" dentro de la hoja; la hoja DEBERÁ quedar fija (sticky) solo en 1024 px o más de ancho y 800 px o más de alto.
- RF29 (porcentajes) [RETIRADO en la ronda 4, ver RF45: el subtítulo de porcentajes ya no existe]: CUANDO se muestre el subtítulo, el sistema DEBERÁ calcular enteros sobre la base sin IVA, que sumen 100 (mayor resto), solo de los tramos con importe; con un solo tramo, "El 100 % sale del tramo 1"; con 0 usuarios, sin subtítulo.
- RF30 (guardadas, alta y presentación) [atajos y foco modificados en la ronda 4, ver RF47 y RF48; la lista de guardadas pasa a tabla semántica en RF57]: CUANDO se muestren las simulaciones guardadas, el sistema DEBERÁ mostrarlas en filas de 48 px con columnas usuarios, total, fecha y divisa (apiladas en menos de 640 px), cada una expandible con el detalle actual; CUANDO se muestre el alta de cliente, DEBERÁ agrupar el formulario en "Empresa" (nombre, país, NIF) y "Contacto y plan" con ancho de lectura máximo de 560 px; MIENTRAS esté activo el modo presentación (tecla P), DEBERÁ mostrar solo la escalera con el slider y la cifra de usuarios, y la hoja completa, ampliados por 1,25 (total de 64 a 80 px, cifra de usuarios de 48 a 60 px, tabla de 14 a 17,5 px), más una barra mínima con el selector de divisa y "Salir de la presentación".

Resto de funciones y estados
- RF-aviso: CUANDO se muestren avisos (tipo de cambio no disponible o antiguo, guardado, errores), el sistema DEBERÁ usar fondo `--color-*-bg`, borde `--color-*`, texto `--color-text` o `--color-*-text` y un prefijo textual o icono, sin depender solo del color.
- RF-barra: CUANDO se muestra la barra, el sistema DEBERÁ colorear el tramo 1 con `--color-chart-1`, el 2 con `--color-chart-2`, el 3 con `--color-chart-3` y el IVA con `--color-chart-vat`, con el texto `--color-on-chart-*` correspondiente, separar los segmentos con 2 px de `--color-surface` y bordear la pista con `--color-border-control`; CUANDO un segmento sea de 0 usuarios o 0 céntimos, NO DEBERÁ dejar segmento ni separador y la tabla DEBERÁ mantener su fila a 0. [Modificado en la ronda 2: se retiran el umbral del 12 %, las etiquetas exteriores con muestra de 12 px y los importes de la barra; el texto de los segmentos pasa a regirse por RF41.]
- RF-slider: CUANDO se estile el slider, el sistema DEBERÁ usar los mismos tokens en WebKit y Firefox y en ambos temas: thumb `--color-action` con contorno de 2 px de `--color-surface`, pista `--color-border-control`, relleno `--color-action`, foco con `--color-focus`.
- RF-selector: CUANDO se muestre el selector de divisa, el sistema DEBERÁ conservar las 23 divisas, su estado deshabilitado con "Reintentar" y, [RETIRADO en la ronda 4: el pie "Tipos actualizados" ya no se muestra en ninguna parte, ver RF45], con borde `--color-action` y foco `--color-focus`; NO DEBERÁ mostrar atribución de ExchangeRate-API en ninguna pantalla.
- RF-bandera: CUANDO se muestre el país de un cliente, el sistema DEBERÁ mostrar la bandera de flagcdn.com con el código ISO visible, `alt` y borde de 1 px `--color-border-control`; SI la bandera no carga (también en la primera carga), ENTONCES el sistema DEBERÁ mostrar solo el código ISO, sin icono roto, sin hueco y sin descolocar la columna.
- RF-estados: CUANDO una pantalla esté cargando, falle o no tenga datos, el sistema DEBERÁ mostrar el esqueleto (superficie `--color-surface-2` con pulso de opacidad), el error (con anuncio accesible) o el vacío con los estilos nuevos y las mismas acciones; CON movimiento reducido el esqueleto DEBERÁ quedar estático pero visible.
- RF-importes: CUANDO se muestre un importe, el sistema DEBERÁ conservar el formato en céntimos enteros, sin cambios en `format-money`, `shared/` ni `backend/`.

Tema y accesibilidad
- RF-tema1: MIENTRAS el usuario no haya elegido tema, o `som-theme` falte o no sea `dark` ni `light`, el sistema DEBERÁ aplicar el tema oscuro del Anexo A, sin depender de `prefers-color-scheme`.
- RF-tema2: CUANDO se cargue la página, el sistema DEBERÁ fijar `data-theme` con la preferencia guardada antes del primer pintado (script en línea en `index.html`, que deja de arrancar con `dark` fijo).
- RF-tema3: CUANDO el usuario elija un tema, el sistema DEBERÁ conservar `data-theme`, `som-theme` y `color-scheme` (`dark` en el oscuro y `light` en el claro) con el comportamiento actual.
- RF-tema4: CUANDO se muestre el selector de tema, el sistema DEBERÁ sustituir el botón con texto actual ("Claro"/"Oscuro") por un control de dos botones siempre visibles, sin texto visible: un sol para el tema claro y una luna para el tema oscuro, cada uno con nombre accesible ("Tema claro", "Tema oscuro") y `aria-pressed` (true en el activo), agrupados con nombre "Tema"; el activo DEBERÁ resaltarse con fondo `--color-action`, icono `--color-on-action` y borde, y el inactivo con borde `--color-border-control` e icono `--color-text-muted`, de modo que el resalte no dependa solo del color (fondo relleno frente a contorno); cada botón DEBERÁ medir 44 px como mínimo, mostrar el foco de RF32, y los iconos DEBERÁN ser SVG en línea con `currentColor` y `aria-hidden`, sin dependencias nuevas ni colores a mano; el control NO DEBERÁ mostrarse en modo presentación (como hoy).
- RF31: CUANDO se ejecuten los tests, un test de contraste DEBERÁ leer el bloque de `DESIGN.md`, calcular la razón WCAG de los pares de la lista cerrada (sección Contraste) en ambos temas, mezclando los tokens con transparencia sobre la superficie, y fallar si alguno no llega a su umbral.
- RF32: CUANDO el usuario navegue con teclado, el sistema DEBERÁ mostrar en todo elemento interactivo un contorno de 2 px `--color-focus` con separación de 2 px, y no suprimirlo salvo en elementos nativos deshabilitados; el orden de tabulación DEBERÁ seguir el orden visual.
- RF33: SI el sistema operativo activa `forced-colors`, ENTONCES el sistema DEBERÁ mantener visibles bordes, foco, thumb del slider, escalones y segmentos (con borde de color de sistema).
- RF34: SI el usuario tiene movimiento reducido, ENTONCES el sistema DEBERÁ suprimir las animaciones y transiciones no esenciales.
- RF35: CUANDO el ancho sea de 360 px o más, o de 640 px con zoom del 200 %, el sistema DEBERÁ mostrarse sin desbordamiento horizontal de página; solo la tabla de desglose podrá desplazarse dentro de su contenedor, y los textos largos DEBERÁN partirse en lugar de salirse.

Documentación y sin regresión
- RF36: CUANDO se complete el rediseño, `DESIGN.md` DEBERÁ tener el texto descriptivo adaptado a SaaS-O-Matic (sin referencias a salud), los tokens originales intactos, las desviaciones registradas (44 px, 16 px en campos, chips de plan neutros), la descripción de la composición de las pantallas y del selector (lista con CHF y bandera de flagcdn.com), sin mencionar la atribución de ExchangeRate-API; el test que hoy exige esa mención DEBERÁ actualizarse.
- RF37: CUANDO se complete el rediseño, `MEMORY.md` DEBERÁ reescribir D6 (ya no "basada en InsightDeck": oscuro por defecto derivado de Verdana, radios de 8 px, elevación por tokens, composición del mockup), registrar la aceptación de Google Fonts y la eliminación de la atribución de ExchangeRate-API como decisión que deroga el RF12 de 007 (y la parte de D18 que la citaba), y cerrar las pendientes de 005 (sombra sin token, umbral del 12 %) y de 007 (contraste en ambos temas, teclado, respaldo sin red).
- RF38: CUANDO se ejecuten los tests y el lint, el sistema DEBERÁ pasarlos (con ajustes y retiradas solo donde dependan de clases, tema, textos, composición o atribución), sin dependencias nuevas y sin cambios en `shared/`, `backend/` ni en `frontend/src/lib/` salvo lo imprescindible para el tema.

## Cambios tras implementación (ronda 2)
La spec sigue aprobada y los cambios se aprueban por diff; puede haber más. Resumen de lo que cambia: RF39 (nuevo, selector de divisa), RF40 (sustituye al RF21), RF41 (sustituye a la parte de etiquetas del RF-barra y al umbral del 12 %) y RF42 (nuevo, tabla).

- RF39 (separación de la flecha de los selects): CUANDO se muestre cualquier `<select>` (divisa de la cabecera, país y plan del alta), el sistema DEBERÁ dejar la flecha del desplegable (propia o nativa) a una distancia del borde derecho de al menos `--space-md` (16 px), con el relleno derecho del campo definido con tokens de espaciado, sin que el texto de la opción elegida se solape con la flecha ni se desborde el campo a 360 px.
- RF40 (cabecera del detalle): CUANDO se muestre el detalle de un cliente, el sistema DEBERÁ colocar el nombre de la empresa (h1) en su propia fila y, justo debajo, los datos del cliente en una misma línea (bandera con ISO y NIF, correo, chip de plan y "Cliente desde {fecha}"); en pantallas estrechas esa línea DEBERÁ saltar a más líneas sin desplazamiento horizontal; el botón "Modo presentación" DEBERÁ quedar a la derecha de la cabecera, alineado con la fila del nombre, y en menos de 640 px pasar bajo la línea de datos.
- RF41 (barra de tramos sin importes): CUANDO se muestre la barra de tramos de la hoja, el sistema DEBERÁ mostrar dentro de cada segmento solo su nombre ("Tramo 1", "Tramo 2", "Tramo 3") y, en el segmento de IVA, su porcentaje ("IVA 21 %", con el tipo del país), sin importes (que siguen en la tabla); SI el nombre completo no cabe en el segmento, ENTONCES DEBERÁ mostrar la abreviatura ("T1", "T2", "T3"; IVA: "21 %") con el nombre completo para lectores de pantalla; SI ni la abreviatura cabe, ENTONCES el segmento DEBERÁ quedar sin texto visible, con el nombre solo para lectores (el tramo sigue en la tabla); los segmentos abreviados o sin texto DEBERÁN ser enfocables con teclado y mostrar el tooltip de RF14 con el nombre completo ("Tramo 3", "IVA 21 %") al pasar el ratón o con el foco, con el foco visible de RF32; los segmentos con el nombre completo visible no necesitan foco; el texto NO DEBERÁ truncarse con puntos suspensivos ni solaparse, y NO DEBERÁ haber leyenda ni etiquetas bajo la barra. El texto visible conserva el color `--color-on-chart-*` y la separación de 2 px entre segmentos; los segmentos de 0 usuarios o 0 céntimos siguen sin dibujarse (con un país con IVA del 0 % no hay segmento de IVA). El subtítulo de porcentajes del RF29 se mantiene sin cambios.
- RF42 (tabla del desglose centrada y a todo el ancho): CUANDO se muestre la tabla del desglose de la hoja, el sistema DEBERÁ ocupar todo el ancho disponible de la hoja y centrar el contenido de todas las columnas, incluida "Concepto", con sus cabeceras; las filas de base, IVA y total también DEBERÁN centrarse, importes incluidos (se acepta que dejen de alinearse por la coma decimal) [matizado en la ronda 3: su etiqueta ya no ocupa las tres primeras columnas, ver RF44]; lo mismo DEBERÁ valer para la tabla del desglose de cada simulación guardada, que comparte componente.

Casos límite nuevos de la ronda 2:
| Entrada | Salida esperada |
|---|---|
| Segmento con espacio para "Tramo 1" | Se ve "Tramo 1" y nada más (sin importe) |
| Segmento donde "Tramo 2" no cabe pero "T2" sí | Se ve "T2"; los lectores leen "Tramo 2" |
| Segmento donde ni "T3" cabe | Sin texto visible; los lectores leen "Tramo 3"; la tabla lo recoge; con ratón o con Tab muestra el tooltip "Tramo 3" |
| Segmento abreviado ("T2") enfocado con Tab | Foco visible y tooltip "Tramo 2"; Escape lo cierra |
| Segmento con el nombre completo visible | No recibe foco con Tab |
| Segmento de IVA al 21 % | "IVA 21 %"; si no cabe, "21 %"; si ni así, sin texto y "IVA 21 %" solo para lectores |
| País con IVA del 0 % (por ejemplo US) | Sin segmento de IVA ni texto "IVA 0 %" |
| Barra a 360 px o en la hoja de presentación con ampliación ×1,25 | Cada segmento decide por sí mismo entre nombre, abreviatura y nada, sin truncar ni solapar |
| Total o base con muchos dígitos | La barra no muestra importes, así que no se ve afectada |
| Datos del cliente a 360 px con correo largo y nombre de 100 caracteres sin espacios | El nombre se parte; la línea de datos salta de línea y el correo se parte; sin scroll horizontal |
| Botón "Modo presentación" a 1280 px y a 360 px | A la derecha alineado con el nombre desde 640 px; bajo la línea de datos por debajo |
| Selector de divisa con "CHF · franco suizo" a 360 px, y selects de país y plan | Flecha a 16 px o más del borde, texto sin solaparse con la flecha |
| Tabla a 360 px con importes largos (hoja y simulación guardada) | Ocupa el 100 % de su contenedor con el contenido centrado; si no cabe, solo la tabla se desplaza dentro de su contenedor |
| Tabla con "Tramo 3 (51 o más)" a 0 usuarios | Fila centrada, con valores a 0, como las demás |

Criterios de aceptación añadidos: CA11 la cabecera del detalle, la barra de tramos sin importes (con nombre, abreviatura o sin texto visible y siempre con nombre accesible), la tabla centrada a todo el ancho y la separación de la flecha del selector se comprueban en el navegador a 360, 768, 1024 y 1440 px y en presentación; los tests de la barra y de los textos afectados se actualizan sin retirar la cobertura de usuarios 0, 1, 10, 11, 50 y 51.

Decisiones de la ronda 2: flecha separada en todos los `<select>`; botón de presentación bajo los datos en menos de 640 px; tooltip con foco de teclado en los segmentos abreviados o sin texto; tabla centrada en la hoja y en las simulaciones guardadas, con importes centrados.

## Cambios tras implementación (ronda 3)
La spec sigue aprobada y los cambios se aprueban por diff; puede haber más. Resumen: RF43 (nuevo, sustituye a la geometría del RF24 y retira el RF25) y RF44 (nuevo, filas de resumen de la tabla, matiza el RF42).

- RF43 (escalera con tres cuadrados iguales): CUANDO se muestre la escalera de tramos, el sistema DEBERÁ dibujar tres cuadrados de lado fijo (ancho = alto) y del mismo tamaño, uno por tramo, en fila, alineados a la izquierda y encima del slider, con una separación de `--space-sm` (8 px) entre ellos; el lado DEBERÁ ser `calc(var(--space-2xl) * 2)` = 96 px, de modo que los tres más sus dos separaciones (304 px) quepan en la columna a 360 px de pantalla (328 px de ancho útil tras los 16 px de margen a cada lado); cada cuadrado DEBERÁ mostrar dentro el precio por usuario ("10,00 EUR", Fira Code 14 px, 600) y el rango de su tramo ("1–10", "11–50", "51 o más", caption 12 px) con el relleno interior de `--space-sm` y el color `--color-chart-1/2/3` y el texto `--color-on-chart-*`; el sistema NO DEBERÁ mostrar leyenda ni texto de la escalera fuera de los cuadros (se retira la leyenda bajo el slider para el tramo 1) ni variar la altura según el precio; el ancho de los cuadros ya no coincide con las marcas 10 y 50 del slider (el usuario lo acepta), y el slider CONSERVA sus marcas en 10 y 50, sus teclas y sus estilos; SI un tramo no se ha alcanzado, ENTONCES su cuadro DEBERÁ seguir atenuado como en el RF24 (fondo `--color-surface-2`, borde discontinuo de 1 px del color del tramo, texto `--color-text-muted` y texto "no alcanzado" para lectores, sin bajar la opacidad del texto); la lista sigue siendo accesible con el nombre "Precio por usuario según tramo", sin anuncios al mover el slider. SI el precio o el rango no caben en el ancho interior del cuadrado (lado menos 2 × `--space-sm`, estimado por caracteres de Fira Code como en la barra), ENTONCES el sistema DEBERÁ abreviarlos en el texto visible y DEBERÁ dejar el texto completo para lectores de pantalla ("Tramo 1: 10,00 EUR por usuario al mes, de 1 a 10 usuarios"): el precio pasa de "10,00 EUR" a "10 €" (también "8 €" y "5 €"), el rango "51 o más" pasa a "51+", y "1–10" y "11–50" no se abrevian; SI el precio de CUALQUIERA de los tres cuadrados no cabe, ENTONCES se abrevian LOS TRES precios a la vez ("10 €", "8 €", "5 €") para que sean coherentes entre sí; el rango se abrevia por separado, solo en el cuadrado cuyo rango no quepa (decisión del usuario tras verlo en el navegador). MIENTRAS esté activo el modo presentación, los cuadrados DEBERÁN crecer por 1,25 en ancho, alto y texto (120 px de lado, precio de 17,5 px), con tope de un tercio del ancho útil menos las separaciones para no desbordar en pantallas estrechas.
- RF44 (filas de resumen en la columna "Concepto"): CUANDO se muestre la tabla del desglose (hoja y simulaciones guardadas), las filas "Base", "IVA ({tipo} %)" y "Total" DEBERÁN llevar su etiqueta en la primera columna ("Concepto"), justo debajo de "Tramo 1", "Tramo 2" y "Tramo 3" y con el mismo centrado que ellos, con las celdas de "Unidades" y "Precio" vacías y el importe en "Subtotal"; las etiquetas NO DEBERÁN ocupar varias columnas (ronda 4: las dos celdas vacías pueden ser una sola celda vacía que abarque Unidades y Precio, sin cambio visual; ver RF52).

Casos límite nuevos de la ronda 3:
| Entrada | Salida esperada |
|---|---|
| Tabla con 0 usuarios | Las tres filas de tramo a 0 y, debajo, "Base", "IVA (21 %)" y "Total" en la columna "Concepto", con importes a 0 en "Subtotal" |
| País con IVA del 0 % | Fila "IVA (0 %)" en la columna "Concepto" con 0 en "Subtotal" (la tabla siempre lleva las tres filas de resumen) |
| Fila de resumen y lector de pantalla | La etiqueta es el encabezado de la fila; las celdas de "Unidades" y "Precio" quedan totalmente vacías (sin guion) y no leen contenido |
| Tabla a 360 px | Mismas columnas y centrado; si no cabe, solo la tabla se desplaza dentro de su contenedor |
| Escalera con cualquier número de usuarios (0, 1, 10, 11, 50, 51) | Tres cuadros del mismo tamaño en todos los casos; solo cambia cuáles están atenuados (no alcanzados) |
| Slider arrastrado o con teclado | Marcas 10 y 50 y teclas sin cambios; la escalera no se mueve ni se anuncia |
| Escalera en el tema oscuro y en el claro | Texto de cada cuadro con contraste 4,5:1 sobre su color y borde discontinuo con 3:1 sobre la superficie |

Criterio de aceptación añadido: CA12 la escalera de cuadros iguales, sin leyenda externa, y las filas de resumen de la tabla en la columna "Concepto" se comprueban en el navegador a 360, 768, 1024 y 1440 px, en presentación ×1,25 y en ambos temas; los tests de la escalera (`buildLadder`, `TierLadder`) y de la tabla se actualizan sin retirar la cobertura de usuarios 0, 1, 10, 11, 50 y 51.

Decisiones de la ronda 3: cuadrados fijos de 96 px alineados a la izquierda (96 = `--space-2xl` × 2: tres cuadrados y dos separaciones de 8 px suman 304 px, que caben en los 328 px útiles a 360 px, y dan 80 px interiores para "10,00 EUR" y "51 o más"); texto que no cabe, abreviado ("10 €", "51+") con el texto completo para lectores; presentación ×1,25 con crecimiento en ancho, alto y texto (con tope de un tercio del ancho útil a 360 px); celdas de Unidades y Precio vacías en las filas de resumen.

## Cambios tras implementación (ronda 4)
Dos partes: (A) estado de la hoja tras las ediciones manuales del usuario (intencionadas) y limpieza; (B) correcciones de la auditoría web-design-guidelines (el usuario pide "solucionar todo lo encontrado"). Resumen: RF28, RF29 y RF-selector (pie) modificados o retirados; RF20 y RF30 modificados; RF45 a RF60 nuevos. Las preguntas de esta ronda están resueltas (ver "Decisiones de la ronda 4" al final). Donde esta spec o el plan digan "tecla P" o "atajo P" en rondas anteriores, rige el atajo Alt+P (RF48).

A) Estado nuevo de la hoja y limpieza
- RF45 (hoja tras las ediciones manuales): CUANDO se muestre la hoja de presupuesto, el sistema DEBERÁ titularla "Presupuesto" (no "Presupuesto mensual") y mostrar el chip de divisa, el total en EUR, la vista previa convertida bajo el total cuando la divisa no sea EUR, la barra de tramos, la tabla del desglose y el pie; NO DEBERÁ mostrar "IVA incluido", la hora de tipos ("Tipos actualizados: HH:MM"), la línea de base e IVA bajo el total ni el subtítulo de porcentajes de la barra. La etiqueta sobre la escalera pasa a "Precio por usuario, en EUR". Con esto, la hora de los tipos no se muestra en ninguna pantalla (aceptado por el usuario, derogando el RF12 de la 007 también en este punto).
- RF46 (limpieza y tests): CUANDO se complete la ronda, el código DEBERÁ estar limpio de lo retirado por RF45: sin código comentado ni muerto (`buildSubtitle`, `subtitle` y `splitPercentages` si quedan sin uso, `.chart__subtitle`, `.sheet__split`, `.sheet__meta` y su `<p>` vacío, importaciones y constantes sin uso como `formatClock` y `NBSP`, la propiedad `ratesAt` si queda sin uso, las líneas CSS comentadas); y los tests que hoy fallan por estas ediciones DEBERÁN adaptarse al estado nuevo sin perder cobertura de lo que sigue existiendo: el orden del DOM del detalle, el modo presentación, la barra (sin subtítulo), la vista previa (bajo el total) y los avisos de guardado de la hoja; los tests de lo retirado ("IVA incluido", "Tipos actualizados", subtítulo) se eliminan y las esperas de "tipos cargados" usan otra señal.

B) Correcciones de la auditoría
Importantes
- RF47 (foco y anuncio en presentación): CUANDO el usuario entre o salga del modo presentación (con el botón o con el atajo), el sistema DEBERÁ mover el foco al botón equivalente ("Salir de la presentación" al entrar; "Modo presentación" al salir) y DEBERÁ anunciar el cambio ("Modo presentación activado" o "desactivado") en una región `aria-live` estable, sin perder el foco.
- RF48 (atajos de presentación; modifica RF30): SI el foco está en un `select`, `input` o `textarea`, o en un elemento editable, ENTONCES `Escape` NO DEBERÁ salir de la presentación; SI hay un tooltip abierto, ENTONCES `Escape` DEBERÁ cerrar solo el tooltip y no salir; para cumplir WCAG 2.1.4 el atajo de una sola tecla `P` DEJA de existir y se reasigna a `Alt+P`, detectado por `event.code === 'KeyP'` con Alt y sin Ctrl, Meta ni Mayús (así funciona también en Mac, donde Option+P produce otro carácter), que NO DEBERÁ actuar con el foco en un campo editable, un `select` o un `textarea`; el botón "Modo presentación" DEBERÁ indicar el atajo en su texto o ayuda ("Modo presentación (Alt+P)") y declararlo con `aria-keyshortcuts="Alt+P"`; `Escape` sigue saliendo de la presentación con las guardas anteriores.
- RF49 (foco en `forced-colors` y en campos): CUANDO un campo (`.input`) reciba el foco con teclado, el sistema DEBERÁ mostrar un indicador que sobreviva a `forced-colors` (contorno transparente de 2 px con separación, que el modo de alto contraste pinta, además del borde y el anillo actuales) en lugar de `outline: none`.
- RF50 (barra estable y accesible; modifica RF41 y RF14): CUANDO cambie el nivel de texto de un segmento de la barra (completo, abreviado o ninguno) por un cambio de ancho o de usuarios, el sistema NO DEBERÁ remontar el segmento ni perder el foco: la estructura del segmento es estable y el `Tooltip` está siempre presente, solo activo cuando el texto no es el completo; los segmentos enfocables (abreviados o sin texto) DEBERÁN ser un `<button type="button">` sin acción propia (disparador de tooltip) en lugar de un `div` con `role="img"` y `tabindex`; su nombre completo DEBERÁ leerse una sola vez (el texto abreviado va oculto a lectores y el tooltip no se enlaza con `aria-describedby` en la barra); los nombres de tramo y de IVA ("Tramo 1", "IVA 21 %") y el rango "51 o más" DEBERÁN llevar espacio duro (NBSP) para no partirse.
- RF51 (medidas sin parpadeo y escalera): CUANDO se mida el ancho de la barra o de un cuadrado de la escalera, el sistema DEBERÁ medir antes del primer pintado (sin parpadeo entre texto completo y abreviado); el ancho por defecto de la escalera DEBERÁ tener en cuenta la presentación (120 px frente a 96 px); los tamaños de fuente usados para decidir si el texto cabe DEBERÁN tener una única fuente de verdad con el CSS (constantes compartidas validadas por un test contra los tokens `--fs-body-sm` y `--fs-caption` y la escala de presentación de 1,25); el borde de 1 px de los cuadrados (todos llevan borde, transparente si están alcanzados, para que la medida no cambie) y el de la barra DEBERÁN descontarse del ancho disponible; el texto accesible de la escalera DEBERÁ construirse con los límites del tramo (`from` y `to`) guardados en el modelo y no cortando textos; `shortPrice` DEBERÁ usar `Intl.NumberFormat` (con "10 €" y "10,50 €" como resultados) y el rango "51 o más" DEBERÁ llevar NBSP.

Menores
- RF52 (tabla del desglose): CUANDO se muestre la tabla (hoja y simulaciones guardadas), la región con desplazamiento SOLO DEBERÁ ser enfocable si hay desbordamiento real y DEBERÁ llevar un nombre único por instancia (por ejemplo "Desglose por tramos" en la hoja y "Desglose de la simulación del {fecha}" en cada guardada); el texto de las cabeceras de fila DEBERÁ usar peso 500 (sin negrita sintética); las filas de resumen DEBERÁN llevar su etiqueta en "Concepto" y una única celda vacía que abarque Unidades y Precio (sin cambio visual); el código DEBERÁ usar comillas simples como el resto del repositorio.
- RF53 (guardar y avisos): MIENTRAS el guardado esté bloqueado por validación, el botón "Guardar simulación" DEBERÁ usar `aria-disabled` (con el mismo aspecto atenuado, conservando el foco y apuntando a su explicación con `aria-describedby`) en lugar de `disabled`, e ignorar la pulsación; durante el guardado en curso sigue deshabilitado; la región `aria-live` del guardado DEBERÁ anunciar solo el encabezado ("Presupuesto guardado"), no la tabla; CUANDO no se pueda calcular el precio, el mensaje DEBERÁ ser "No se puede calcular el precio de este cliente. Revisa su país o vuelve a la lista." con el enlace "Volver a la lista".
- RF54 (slider): CUANDO se use el slider, el sistema DEBERÁ exponer `aria-valuetext` ("N usuarios", "1 usuario"); CUANDO el número de usuarios supere el máximo del slider (100), el sistema DEBERÁ mostrar bajo el slider la nota "El control llega a 100; escribe más en el campo" (con `aria-describedby` desde el slider mientras se muestre) y ampliar el `aria-valuetext` ("N usuarios (el control llega a 100)"); con 100 usuarios o menos la nota no se muestra; el desfase DEBERÁ quedar documentado en D13 de `MEMORY.md`.
- RF55 (lista de clientes: semántica y uso): CUANDO se muestre la lista, el correo y el NIF DEBERÁN poder seleccionarse y copiarse (el enlace estirado de la fila no los tapa; el resto de la fila sigue siendo clicable); en menos de 768 px, donde la tabla se muestra apilada, la semántica de tabla DEBERÁ conservarse con roles explícitos (`table`, `rowgroup`, `row`, `columnheader`, `cell`) y la cabecera DEBERÁ ocultarse solo visualmente (no con `display: none`); el texto "Alta" de cada fila apilada DEBERÁ ser texto real (oculto en escritorio) y no un `::before`; las columnas numéricas y de fechas DEBERÁN usar cifras tabulares.
- RF56 (contador de clientes): CUANDO la lista tenga más resultados que filas mostradas, el contador junto al H1 DEBERÁ mostrar el total de clientes que cumplen la búsqueda ("12 clientes") y la nota "Mostrando N de M" DEBERÁ seguir indicando cuántas filas hay; sin paginación nueva (la API no la tiene); sin truncado, el contador coincide con las filas.
- RF57 (simulaciones guardadas como tabla): CUANDO se muestren las simulaciones guardadas, el sistema DEBERÁ presentarlas como tabla semántica (cabeceras Usuarios, Total, Fecha y Divisa visibles para lectores) manteniendo las filas expandibles: un botón con `aria-expanded` y `aria-controls` en cada fila (nombre accesible "Desglose de la simulación del {fecha}") que muestra u oculta una fila con el detalle actual; mismo orden, mismas columnas y mismo aspecto.
- RF58 (textos y formularios): CUANDO se generen plurales ("1 usuario", "2 usuarios", "1 simulación", "1 cliente"), el sistema DEBERÁ usar `Intl.PluralRules` con un helper en `frontend/src/lib/pluralize.ts` (excepción autorizada a la regla de no tocar `src/lib/`, junto con `keyboard.ts` de RF48; sin más excepciones) y sus tests; los chips de plan y los códigos de divisa DEBERÁN llevar `translate="no"`; el desplegable de plan DEBERÁ mostrar "Starter", "Growth" y "Enterprise" sin cambiar el valor enviado; los campos de NIF y correo DEBERÁN llevar un texto de ejemplo (placeholder) con contraste AA y sin autocorrección (`spellcheck` desactivado, modo de entrada de correo).
- RF59 (CSS global y documentación): el sistema DEBERÁ sustituir `4px` por `var(--space-xs)` en la tabla a 480 px o menos; usar `tabular-nums` en las columnas numéricas y de fechas; aplicar `overscroll-behavior: none` a `html` solo con `@media (pointer: fine)`; limitar `overflow-wrap: anywhere` a los contenedores de texto libre (títulos, nombres, correos) de modo que no parta palabras en botones, chips ni cabeceras de tabla a 320 px; y documentar en el CSS que `.content:focus` sin contorno es intencionado (destino de foco programático del enlace "Saltar al contenido").
- RF60 (favicon): CUANDO se cargue la aplicación, el sistema DEBERÁ ofrecer un favicon SVG (archivo en `public/` enlazado desde `index.html`, con los colores de los tokens `--color-action` y `--color-sage`, validados por un test contra `DESIGN.md`), sin literales de color en `index.html` ni en `src/`.

Casos límite nuevos de la ronda 4:
| Entrada | Salida esperada |
|---|---|
| Entrar en presentación con el botón o con el atajo | El foco queda en "Salir de la presentación" y se anuncia "Modo presentación activado" |
| Salir con el botón, con Escape o con el atajo | El foco vuelve a "Modo presentación" y se anuncia "desactivado" |
| Escape con el foco en un `select` abierto, un `input` o el slider | No sale de la presentación |
| Escape con un tooltip de la barra abierto | Cierra solo el tooltip |
| Escape sin foco en un campo y sin tooltip | Sale de la presentación |
| Campo enfocado con `forced-colors` activo | Indicador de foco visible (contorno del sistema) |
| Segmento de la barra que pasa de "Tramo 2" a "T2" mientras está enfocado | No se remonta; el foco no se pierde mientras siga siendo enfocable |
| Lector de pantalla en un segmento abreviado | Lee el nombre completo una sola vez |
| Primer pintado de la escalera en presentación | Sin salto entre precio completo y abreviado |
| Cuadrado atenuado (borde de 1 px) frente a uno alcanzado | Misma medida y mismo texto; la decisión de abreviar no cambia al alcanzarse el tramo |
| Tabla más ancha que su contenedor | La región es enfocable y tiene nombre único; si no desborda, no recibe foco |
| Dos tablas en pantalla (hoja y simulación guardada abierta) | Cada región tiene un nombre distinto |
| Guardar bloqueado por un campo inválido | El botón conserva el foco, está atenuado, no guarda y apunta a su explicación |
| Guardado correcto | Se anuncia solo "Presupuesto guardado" |
| País sin cálculo posible | Mensaje con siguiente paso y enlace "Volver a la lista" |
| Slider con 60 usuarios | `aria-valuetext` "60 usuarios" |
| Usuarios 1, 2 y 101 en el campo | "1 usuario", "2 usuarios" y, para 101, el slider queda en 100 y aparece la nota "El control llega a 100; escribe más en el campo" |
| Usuarios 100 y 101 | Con 100 no hay nota; con 101 aparece y el `aria-valuetext` dice "101 usuarios (el control llega a 100)" |
| Alt+P con el foco fuera de un campo | Entra o sale de la presentación (también en Mac, por `event.code`) |
| Tecla P sola, o Alt+P con el foco en un campo o select | No hace nada |
| Copiar el correo o el NIF de una fila | Se pueden seleccionar; clicar fuera de ellos abre el cliente |
| Lista a 360 px | Sigue siendo una tabla para lectores, con cabecera oculta solo visualmente y "Alta" como texto |
| 12 clientes con 10 mostrados | Contador "12 clientes" y nota "Mostrando 10 de 12" |
| Simulaciones guardadas con teclado | Tab llega al botón de cada fila, Intro o Espacio expande y `aria-expanded` cambia |
| Desplegable de plan | Muestra "Starter", "Growth" y "Enterprise"; se envía `starter`, `growth` o `enterprise` |
| Botón o chip a 320 px | No se parten palabras |

Criterio de aceptación añadido: CA13 los tests actualizados y nuevos de la ronda pasan (`npm test`, `npm run lint`, tokens, contraste y espaciado); no queda código comentado ni muerto de lo retirado; y las comprobaciones manuales de foco, `forced-colors`, 320, 360 y 768 px y presentación se anotan para el reviewer.

Decisiones de la ronda 4: el atajo de presentación pasa a Alt+P por `event.code` y se indica en el botón y en `aria-keyshortcuts`; única excepción autorizada a la regla de no tocar `frontend/src/lib/`: `pluralize.ts` y `keyboard.ts` (con sus tests); "Tipos actualizados" no se muestra en ninguna parte (decisión del usuario, y los tests usan otra señal de "tipos cargados"); nota bajo el slider con más de 100 usuarios, además de `aria-valuetext` y D13; el estado en la URL (presentación, divisa, usuarios) queda fuera de esta spec.

## Cambios tras implementación (ronda 5)
Dos cambios: (A) el desglose de una simulación guardada, que hoy se ve roto al abrirlo; (B) una columna de acciones, sin función por ahora, en la lista de clientes. Resumen: RF42 y RF44 se refuerzan para la tabla de guardadas; RF61 a RF67 nuevos. Las preguntas P1 y P2 están decididas.

A) Desglose de las simulaciones guardadas
- RF61 (mismo desglose que la hoja): CUANDO se abra una simulación de la lista de guardadas (1280 px y cualquier ancho), el sistema DEBERÁ mostrar su tabla del desglose exactamente como la de la hoja de presupuesto: las mismas cabeceras (Concepto, Unidades, Precio, Subtotal), bordes, tipografía y centrado (RF42), a todo el ancho de la fila, con "Base", "IVA ({tipo} %)" y "Total" bajo "Concepto" (RF44) y sin tarjeta alrededor; las celdas NO DEBERÁN apilarse en una columna estrecha ni las cabeceras comprimirse. El bloque de conversión que va debajo (Divisa, Tipo, Fecha del tipo, importes convertidos) se queda como está. La tabla se alinea con el contenido de la fila (mismo relleno lateral de `--space-md`) [decidido: P1].
- RF62 (aislamiento de estilos): los estilos de la lista de guardadas y de la lista de clientes NO DEBERÁN afectar a tablas anidadas (la tabla del desglose dentro de una fila de guardadas): sus reglas sobre `thead`, `tbody`, `tr`, `th` y `td` DEBERÁN limitarse a los elementos propios de la lista (selectores hijo directo o clases propias) y no a descendientes cualesquiera; un test DEBERÁ cubrirlo.
- RF63 (móvil): CUANDO se abra el desglose a 375 px (y a 360 px), la tabla anidada DEBERÁ conservar sus cuatro columnas y desplazarse dentro de su propia región con desplazamiento horizontal, como la de la hoja, sin apilarse y sin desbordar la página (RF35).

B) Acciones en la lista de clientes (sin función por ahora)
- RF64 (columna "Acciones"): CUANDO se muestre la lista de clientes, el sistema DEBERÁ añadir una última columna "Acciones" con dos botones de solo icono por fila: "Editar" (icono de lápiz) y "Borrar" (icono de papelera), como SVG en línea de `ui/icons.tsx` con `currentColor`; la cabecera "Acciones" DEBERÁ ser visible [decidido: P2]; en menos de 768 px, donde las filas se apilan, los dos botones DEBERÁN ir en una línea al final de la fila, sin tapar el nombre ni los datos.
- RF65 (deshabilitados y accesibles): los botones de acción NO DEBERÁN tener función todavía y DEBERÁN mostrarse deshabilitados por decisión del usuario, hasta que se implemente la función. Como un `button` con `disabled` nativo no recibe foco ni anuncia su motivo, DEBERÁN usar `aria-disabled="true"` (conservan el foco y el tooltip) e ignorar la pulsación; su nombre accesible DEBERÁ incluir la empresa ("Editar Panadería Los Álamos", "Borrar Panadería Los Álamos") y, al pasar el ratón o con el foco (también al tocarlos en móvil), DEBERÁ verse el aviso "Próximamente" con el `Tooltip` del sistema (RF14), enlazado con `aria-describedby`; pulsarlos NO DEBERÁ abrir el cliente ni activar el enlace estirado de la fila.
- RF66 (aspecto y objetivos): los botones DEBERÁN tener un área táctil de 44 px como mínimo, foco visible (RF32) y cursor de no permitido; "Editar" usa el estilo fantasma del sistema; "Borrar" usa el estilo fantasma con el icono en `--color-error-text` (destructivo suave); mientras estén deshabilitados, ambos se muestran al 40 % de opacidad (RF9) y sus iconos mantienen el contraste de elementos deshabilitados exentos; el foco y el tooltip NO DEBERÁN quedar tapados por el enlace estirado de la fila (los botones van por encima de él).
- RF67 (documentación de lo pendiente): CUANDO se complete la ronda, `MEMORY.md` DEBERÁ anotar como pendiente, para la MISMA spec futura que hará la paginación de "Mostrando N de M", la funcionalidad de editar y borrar clientes (backend y frontend), con el aviso de que el borrado necesita confirmación y de que hoy un cliente con simulaciones no se puede borrar (FK `ON DELETE RESTRICT`, D14); esa spec se crea más adelante y aquí solo se anota.

Casos límite nuevos de la ronda 5:
| Entrada | Salida esperada |
|---|---|
| Abrir una simulación guardada a 1280 px | Tabla del desglose con 4 columnas, centrada y a todo el ancho de la fila, con Base, IVA y Total bajo "Concepto"; el bloque de conversión debajo, sin cambios |
| Abrir dos simulaciones a la vez | Cada tabla se ve igual que la de la hoja; sin estilos cruzados |
| Abrir una simulación a 375 px | La tabla no se apila; se desplaza en su región; la página no desborda |
| Simulación con divisa distinta de EUR | El desglose sigue en EUR (como en la hoja) y el bloque de conversión muestra la divisa de la simulación |
| Cualquier selector de `lists.css` sobre una tabla anidada | No coincide con ningún elemento de la tabla del desglose (test) |
| Lista de clientes con 1 o con 10 filas | Cada fila tiene "Editar" y "Borrar" con el nombre de su empresa |
| Pulsar "Editar" o "Borrar" | No pasa nada: no se navega, no se abre el cliente y no se envía nada |
| Tab por la fila | El foco llega a los dos botones; se ve el foco y el aviso "Próximamente" |
| Lector de pantalla en "Borrar Panadería Los Álamos" | Se anuncia como botón no disponible, con la descripción "Próximamente" |
| Pasar el ratón por un botón de acción | Se muestra "Próximamente" y la fila no se activa |
| Lista a 360 px (filas apiladas) | Dos botones de 44 px en una línea al final de la fila; sin desbordar |
| Empresa con nombre largo (100 caracteres sin espacios) | El nombre accesible lo contiene entero; el botón no se deforma |
| `forced-colors` activo | Los botones y su foco siguen visibles |

Criterio de aceptación añadido: CA14 el desglose de una guardada se ve como el de la hoja a 1280, 768 y 375 px, comprobado en el navegador; el test de aislamiento de estilos pasa; los botones de acción están, deshabilitados, accesibles y sin efecto; `MEMORY.md` recoge lo pendiente (RF67); y `npm test` y `npm run lint` pasan.

Preguntas abiertas de la ronda 5:
- P1 [DECIDIDA]: en el desglose abierto, la tabla se alinea con el contenido de la fila (relleno lateral de 16 px, como las columnas de la lista).
- P2 [DECIDIDA]: la cabecera de la columna nueva, "Acciones", es visible.

## Contraste: lista cerrada de pares y método
Método: RF31 (razón de luminancia relativa WCAG 2.x; los tokens con transparencia se mezclan sobre `--color-surface`). Se comprueba en ambos temas.
- Texto, 4,5:1: `text` y `text-muted` sobre bg, surface y surface-2 (incluye el escalón no alcanzado); `sage-text` y `sage-text-hover` sobre bg, surface y surface-2; `error-text` sobre bg, surface y surface-2; `success-text`, `warning-text`, `error-text` e `info-text` sobre su `*-bg` mezclado; `on-action` sobre `action` y `action-hover` (incluye el icono del tema activo, 3:1 como mínimo); `text-muted` sobre `surface` (icono inactivo); `on-error-strong` sobre `error-strong` y su hover; `on-sage` sobre `sage`; `on-chart-1..3` y `on-chart-vat` sobre su relleno (escalones, segmentos); `tooltip-text` sobre `tooltip-bg`; `text` sobre `hover` y `active` mezclados.
- No texto, 3:1 (WCAG 1.4.11): `border-control` sobre bg, surface y surface-2; `focus` sobre bg, surface y surface-2; `action` sobre bg y surface; `sage` y `error` sobre surface (selección, indicador de navegación y borde de error); `chart-1`, `chart-2`, `chart-3` y `chart-vat` sobre surface (escalones, segmentos y borde discontinuo; los segmentos se separan con 2 px de surface, por eso se mide contra ella).
- Exentos: elementos deshabilitados y `focus-ring` (decorativo; el borde de 2 px lleva el contraste).

## Casos límite (tabla entrada → salida esperada)
| Entrada | Salida esperada |
|---|---|
| Usuarios 0 | Cifra 0; escalera con los tres escalones no alcanzados; explicación "el importe es 0"; total 0, barra vacía sin subtítulo y tabla a 0 |
| Usuarios 1 | Solo tramo 1 alcanzado; "El 100 % sale del tramo 1"; segmento "Tramo 1" con su nombre dentro e "IVA 21 %" en el segmento de IVA |
| Usuarios 10 | Solo tramo 1; tramos 2 y 3 no alcanzados, sin segmento en la barra |
| Usuarios 11 | Tramos 1 y 2; el segmento del tramo 2 es muy estrecho: muestra "T2" si cabe y, si no, ningún texto visible; su nombre completo sigue para lectores y en la tabla; sin leyenda bajo la barra; explicación con 10 y 1 usuarios |
| Usuarios 50 | Tramos 1 y 2 completos; tramo 3 no alcanzado |
| Usuarios 51 | Tres tramos; el segmento del tramo 3 (1 usuario) es casi invisible: sin texto visible y "Tramo 3" solo para lectores; sigue en la tabla |
| Usuarios 100 000 (campo numérico; el slider se queda en su máximo) | Cifra y total sin truncar ni desbordar a 360 px |
| Importe de 0 y de 1 céntimo | Formato actual, en Fira Code, sin cambios de redondeo |
| Total de 13 caracteres (divisa de gran magnitud) | El total reduce su tamaño dentro de la hoja y no se corta |
| Escalera en modo normal desde 360 px | Cuadrados de 96 px con el texto completo ("10,00 EUR" ocupa unos 76 px de los 80 útiles) y sin abreviar |
| Escalera en presentación ×1,25 con ancho de pantalla de 392 px o más | Cuadrados de 120 px con el texto completo (precio de 17,5 px, unos 95 px de los 100 útiles) |
| Escalera en presentación ×1,25 a 360 px (menos de unos 392 px) | Los cuadrados quedan en un tercio del ancho útil (unos 104 px) y el precio y el rango se abrevian ("10 €", "8 €", "5 €", "51+"), con el texto completo para lectores |
| Fuente de respaldo más ancha o zoom del texto | Si el precio de algún cuadrado no cabe, los tres precios se abrevian a la vez ("10 €", "8 €", "5 €"); cada rango que no quepa se abrevia por separado; nunca se trunca ni se solapa |
| Presentación a 360 px (cuadrados de unos 104 px) | Los tres precios salen abreviados ("10 €", "8 €", "5 €"), nunca mezclados con un precio completo como "8,00 EUR" |
| Tramo no alcanzado | Fondo `surface-2`, borde discontinuo, texto legible a 4,5:1 y texto para lectores "no alcanzado" |
| Divisa distinta de EUR | Total grande, barra y tabla en EUR; la vista previa convertida en la divisa elegida debajo de base e IVA; nota de guardado con el tipo |
| Divisa no disponible o tipos caídos | Opción deshabilitada con "(sin tipo de cambio)"; aviso con texto y "Reintentar" bajo la cabecera |
| Bandera de flagcdn que falla (también en la primera carga de la lista) | Solo el código ISO, sin icono roto ni hueco; la columna "País y NIF" no se descuadra |
| Sin acceso a Google Fonts | `system-ui` y monoespaciada del sistema; importes alineados y usables |
| Texto con #059669 sobre blanco (unos 3,8:1) | Nunca como texto; el texto usa `--color-sage-text` (5,5:1) |
| Éxito #22C55E o aviso #EAB308 | Solo relleno o borde; el texto usa la variante `-text` |
| Botón destructivo con #EF4444 y texto blanco (3,8:1) | Se usa `--color-error-strong` (4,8:1) |
| Borde de campo #E2E8F0 (1,2:1) | Se usa `--color-border-control` (3:1 o más) |
| Navy sobre fondo navy en oscuro | El control usa azul acero con 3:1 sobre superficie |
| Primera visita, `som-theme` ausente o inválido | Tema oscuro desde el primer pintado, sin parpadeo |
| Lista con 0 clientes / búsqueda sin resultados | Estado vacío con sus textos actuales; contador "0 clientes" |
| Lista con 1 cliente | Contador "1 cliente" |
| Cliente sin simulaciones | Número de simulaciones 0 atenuado (siguen 4,5:1); sección guardadas con estado vacío y su acción |
| Nombre de empresa de 100 caracteres sin espacios a 360 px | Se parte dentro de la fila, el título y la línea de contexto, sin desbordar |
| Viewport de 1280 × 720 (menos de 800 px de alto) | La hoja no es sticky (así su pie y el botón Guardar son alcanzables) |
| Campo de recursos con error con el `<details>` cerrado | El `<details>` se abre y el error es visible |
| Zoom del 200 % (640 px de ancho efectivo) | Sin desplazamiento horizontal de página |
| Hover y pulsado en botón, fila y enlace | Cambian de forma visible (borde y fondo, no solo tono tenue) |
| Elemento nativo deshabilitado | Sin foco ni hover, al 40 %; un `aria-disabled` mantiene el anillo de foco |
| `forced-colors` activo | Bordes, foco, thumb, escalones y segmentos siguen visibles |
| Movimiento reducido | Esqueleto estático; sin animaciones no esenciales |
| Selector de tema con teclado y lector de pantalla | Tab entra en el grupo, cada botón se activa con Intro o Espacio y se anuncia "Tema claro/oscuro, pulsado" solo en el activo |
| Pulsar el tema ya activo | Sin cambios y sin parpadeo |
| Tecla P escribiendo en un campo | No activa la presentación (sin cambios) |
| Presentación a 360 px y a 1280 px | Sin desbordamiento; el total no se corta; la barra mínima mantiene divisa y salida |
| Ruta desconocida | 404 con el nuevo estilo y navegación activa sin `aria-current` |

## Criterios de aceptación
- CA1: `design-tokens` en verde con la detección ampliada (RF3) y sin literales en CSS, TSX ni `index.html`.
- CA2: `DESIGN.md` y el archivo de tokens coinciden (RF2) y los tokens antiguos ya no existen.
- CA3: el test de contraste (RF31) pasa en ambos temas con la lista cerrada.
- CA4: todas las pantallas usan fuentes, espaciado, radios y sombras del sistema en ambos temas, y el test de espaciado pasa (RF4).
- CA5: simulador, slider con teclado, selector de divisa, banderas, estados, modo presentación, interruptor de tema, búsqueda y formato de importes funcionan igual que antes (solo cambian disposición y jerarquía).
- CA6: la composición de detalle, lista, alta y presentación sigue el mockup aprobado en 360, 768, 1024 y 1440 px, comprobada en el navegador, sin desbordamiento horizontal ni a 640 px con zoom del 200 %.
- CA7: comprobación manual de teclado (foco visible y orden de tabulación visual) y de respaldo sin red (fuentes y banderas bloqueadas).
- CA8: `npm test` y `npm run lint` en verde, sin dependencias nuevas; no queda código, test ni texto de la atribución de ExchangeRate-API.
- CA9: `DESIGN.md` y `MEMORY.md` actualizados según RF36 y RF37.
- CA10: la auditoría con web-design-guidelines no deja hallazgos de nivel A o AA de WCAG sin resolver (verificación posterior; los de mejora quedan como notas).

## Fuera de alcance
- Cambios en `shared/`, `backend/`, la API, los cálculos, el IVA y las divisas (por eso no hay columna de última simulación).
- Funciones nuevas, edición o borrado de clientes, e internacionalización.
- Una lista de divisas con panel propio o banderas en el selector.
- Pasos previos de capturas o inventario visual.
- Librerías de componentes, de gráficos o de estilos y dependencias de fuentes.
- Prueba con lector de pantalla de la lista larga de divisas (pendiente de 007; verificación manual aparte).
- La auditoría en sí con web-design-guidelines.
