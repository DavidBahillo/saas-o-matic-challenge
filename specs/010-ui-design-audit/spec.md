# 010 · Auditoría de diseño UI (25 puntos)
Estado: aprobada

## Contexto y objetivo (por qué)
Tras la 008 (rediseño Verdana) y la 009 (clientes), una revisión en el navegador ha dejado 25 puntos de pulido en cinco bloques (A tema claro, B lista de clientes, C cabecera, D detalle de cliente, E formularios), registrados en `ai-workspace/ui-audit-pending.md`. El tema claro es demasiado blanco y con poco contraste entre superficies; la lista mezcla datos y repite palabras; el detalle y los formularios cargan texto que los iconos y la jerarquía pueden ahorrar. El objetivo es atender los 25 puntos sin cambiar funciones, datos ni la API: solo tokens, disposición, textos de interfaz, iconos y movimiento.

Marco vigente que esta spec respeta: constitución (principio 9: `DESIGN.md`, contraste AA, responsive desde 360 px, oscuro por defecto), D6 (fuente única de tokens: primer bloque css de `DESIGN.md` igual a `tokens.css`), D16 (alcance del dashboard), D18 y D19 (divisas en vivo y rediseño: sin dependencias nuevas, sin cambios en `shared/`, `backend/` ni `lib/` salvo lo imprescindible). Todo color sale de tokens; los importes siguen en céntimos enteros y el IVA, el redondeo y los tramos no cambian.

### Decisiones del usuario/coordinador incorporadas
- D-U1 Fondo claro exactamente `#E9E9E9`.
- D-U2 Los colores de plan se derivan de la paleta existente: sutiles sobre el fondo y distinguibles entre sí.
- D-U3 Iconos como SVG en línea propios (el repositorio ya tiene un conjunto en `ui/icons`), sin dependencias nuevas.
- D-U4 Punto 21: se investiga qué devuelve open.er-api.com; solo se muestra el símbolo si la API lo da (resultado: no lo da, RF21 descartado).
- D-U5 Contraste: texto oscuro sobre sage, info y azules del chart ≥ 4,5:1; elementos no textuales ≥ 3:1; las limitaciones se declaran (ver "Valores de color propuestos").
- D-U6 La elevación del botón de tema (punto 5) en claro se deriva de la del oscuro (el usuario confirma que hoy "no se ve la línea" en claro; se mantiene `#047857`).
- D-U7 Las animaciones (18, 19) respetan `prefers-reduced-motion`.
- D-U8 Fuente única de tokens: el bloque css de `DESIGN.md` queda idéntico a `tokens.css`.
- D-U9 Botones de acción de fila: fondo `--color-bg` (están dentro de la lista, sobre `--color-surface`). Botones de paginación no activos: fondo `--color-surface` (van sobre el fondo de página).
- D-U10 Columna "Simulaciones": solo el número también en la vista apilada, con nombre accesible.
- D-U11 Punto 18: animación de altura del detalle de cada fila con el chevron girando. Punto 22: centrado solo horizontal. Punto 23: solo se quitan los títulos de grupo y se mantienen las etiquetas de campo.

## Valores de color propuestos (tema claro)
Ratios WCAG calculados a mano (luminancia relativa de `#E9E9E9` = 0,815; blanco = 1; `#0F172A` = 0,009). El test de contraste de la 008 (RF31) es la autoridad: si un par no llega, se ajusta solo la luminosidad del token y se anota en `MEMORY.md`. El tema oscuro no cambia salvo los tokens nuevos marcados.

Jerarquía de luminosidad en claro (de más oscuro a más claro): `--color-bg` #E9E9E9 (0,815) < `--color-surface-2` #EEF1F5 (0,877) < `--color-surface` #FFFFFF (1). Los hovers de fondo opaco dejaban de verse sobre blanco con el fondo nuevo (#F8FAFC daba 1,04:1 frente a la superficie), así que pasan a ser más oscuros que la superficie.

| Token (claro) | Antes | Propuesto | Ratio |
|---|---|---|---|
| `--color-bg` | #F8FAFC | **#E9E9E9** (fijo) | texto `#0F172A` 14,7:1; `--color-text-muted` 6,2:1 |
| `--color-surface` | #FFFFFF | sin cambio | 1,2:1 frente al fondo (la separación la da el borde) |
| `--color-surface-2` | #F1F5F9 | **#EEF1F5** (campos deshabilitados, esqueleto, escalón no alcanzado, chip neutro) | 1,13:1 frente a la superficie; texto `#0F172A` 15,8:1 y `--color-text-muted` 6,7:1 |
| `--color-hover` (fila y tarjeta en hover; hover de los botones de paginación) | #F8FAFC | **#EEF1F5** | 1,13:1 frente a la superficie, con el borde visible y la barra `--color-sage-text` de la fila como segunda pista; texto muted 6,7:1 |
| `--color-ghost-hover` | #F1F5F9 | **#0F172A14** (alfa, vale sobre superficie y sobre fondo) | 1,18:1 sobre la superficie y 1,17:1 sobre el fondo; texto muted ≥ 5,3:1 |
| `--color-secondary-hover` | #0F172A0A | **#0F172A1A** | 1,2:1 sobre superficie y sobre fondo; texto muted ≥ 5,1:1 |
| `--color-active` (fila pulsada) | #0F172A06 | **#0F172A14** | 1,1:1 sobre `--color-hover`; texto muted ≥ 5,6:1 |
| `--color-border` | #E2E8F0 | **#94A3B8** | 2,1:1 sobre el fondo y 2,6:1 sobre la superficie (divisor decorativo; los controles siguen con `--color-border-control`) |
| `--color-border-control` | #64748B | sin cambio | 3,9:1 sobre el fondo, 4,8:1 sobre la superficie (cumple 3:1) |
| `--color-sage` / `--color-chart-2` | #059669 | **#34D399** | texto `--color-on-sage` `#0F172A` 9,3:1 |
| `--color-info` / `--color-chart-3` | #0EA5E9 / #0A9BDC | **#38BDF8** (los dos iguales: ya no hace falta que el chart sea más oscuro) | texto `#0F172A` 8,3:1 |
| `--color-info-text` | #0369A1 | **#075985** (el anterior daba 4,46:1 sobre el chip info sobre el fondo) | 6,2:1 sobre el fondo; 5,6:1 sobre `--color-info-bg` sobre el fondo |
| `--color-info-bg` | #0EA5E915 | **#38BDF826** | (fondo de chips y avisos) |
| `--color-selection` | #05966933 | **#34D39959** | texto `#0F172A` sobre la selección: ≥ 11:1 sobre el fondo y ≥ 13:1 sobre la superficie; texto muted ≥ 5:1 |
| `--color-sage-text`, `--color-focus` | #047857 | sin cambio | 4,5:1 sobre el fondo (justo en el umbral; si el test falla, `#046C4E` da 5,3:1) |

Tokens nuevos de plan (claro / oscuro) y de la línea del botón de tema:
| Token | Claro | Oscuro | Ratio del texto |
|---|---|---|---|
| `--color-plan-starter-bg` (texto `--color-info-text`, en oscuro `#78D0F8`) | #38BDF826 | #78D0F824 | claro: 5,6:1 sobre el fondo, 6,8:1 sobre la superficie; oscuro: 7,23:1 sobre la superficie y 8,26:1 sobre el fondo |
| `--color-plan-growth-bg` | #34D39926 | #68D8A824 | |
| `--color-plan-growth-text` | #065F46 | #68D8A8 | claro: 5,9:1 sobre el fondo, 6,91:1 sobre la superficie; oscuro: 7,18:1 (peor caso) |
| `--color-plan-enterprise-bg` (texto `--color-text`) | #0F172A14 | #48789840 | claro: 12,54:1 sobre el fondo (la superficie queda por encima); oscuro: 9,82:1 sobre la superficie y 10,92:1 sobre el fondo |
| `--color-toggle-line` (línea de elevación del botón de tema) | #047857 | #FFFFFF (valor actual del oscuro) | claro: 3,3:1 sobre el relleno navy del botón activo, 5,5:1 sobre la superficie y 4,5:1 sobre el fondo; oscuro: 4,8:1 sobre `--color-action` |

Limitación declarada (D-U5): con sage, info y chart-3 claros y saturados, el texto oscuro llega de sobra a 4,5:1, pero su relleno solo da 1,6:1 (sage) y 1,8:1 (info) contra el fondo `#E9E9E9`, por debajo de los 3:1 de un elemento no textual. Un relleno claro y un contraste de 3:1 contra un fondo claro son incompatibles. Se acepta porque cada uso lleva otra pista que no es el color (ver el inventario siguiente); donde el color era el único indicador, se cambia de token (RF3, RF4).

Inventario de usos afectados (sage, info y chart en claro):
| Uso | Token | Tratamiento |
|---|---|---|
| Subrayado activo de la navegación (cabecera) | `--color-sage` | pasa a `--color-sage-text` (≥ 3:1 sobre superficie y fondo), además de `aria-current` |
| Barra izquierda del hover de fila de clientes y de simulaciones guardadas | `--color-sage` | pasa a `--color-sage-text` |
| Segmentos de la barra de tramos (tramo 2 sage, tramo 3 info) | `--color-chart-2`, `--color-chart-3` | conservan el relleno; cada uno lleva su nombre en texto o tooltip; el separador de 2 px `--color-surface` entre segmentos da 1,9:1 frente a sage y 2,1:1 frente a info (entre sage e info solos habría 1,1:1, por eso el separador es obligatorio y no se elimina nunca entre segmentos adyacentes) |
| Cuadrados de la escalera alcanzados (tramos 2 y 3) | `--color-chart-2`, `--color-chart-3` | conservan el relleno con precio y rango en texto |
| Cuadrados de la escalera no alcanzados: borde discontinuo del color del tramo | `--color-chart-1/2/3` | en claro, el borde discontinuo usa `--color-border-control` (4,2:1 sobre `--color-surface-2`; el sage nuevo daría solo 1,7:1); en oscuro no cambia; el nombre del tramo y "no alcanzado" siguen en texto |
| Avisos y chips info (borde `--color-info`, texto `--color-info-text`) | `--color-info` | el borde es decorativo: el texto, el icono y el fondo `--color-info-bg` llevan el significado |
| Selección de texto | `--color-selection` | ver tabla de valores |
| Chips de plan | tokens de plan | nombre del plan siempre en texto |
| Segmento y rellenos del slider | `--color-action` | no usa sage (008); sin cambio |

## Requisitos funcionales (EARS)

### A. Tema claro
- RF1 (fondo y jerarquía): MIENTRAS esté activo el tema claro, el sistema DEBERÁ pintar el fondo de página (`--color-bg`) exactamente con `#E9E9E9`, mantener la superficie (`--color-surface`) en `#FFFFFF` y redefinir `--color-surface-2`, `--color-hover`, `--color-ghost-hover`, `--color-secondary-hover` y `--color-active` con los valores de la tabla, de modo que la jerarquía fondo < superficie 2 < superficie se mantenga y los hovers y estados pulsados se distingan sobre superficie y sobre fondo (≥ 1,1:1 y con el texto muted ≥ 4,5:1 encima); el tema oscuro NO DEBERÁ cambiar.
- RF2 (borde): MIENTRAS esté activo el tema claro, el sistema DEBERÁ usar un `--color-border` más oscuro (propuesto `#94A3B8`) para que el borde de tarjetas, divisores y chips se distinga del nuevo fondo (≥ 2:1 sobre él), y `--color-border-control` DEBERÁ seguir dando ≥ 3:1 sobre fondo y superficie.
- RF3 (sage): MIENTRAS esté activo el tema claro, el sistema DEBERÁ usar un sage más claro y saturado (propuesto `#34D399`) en `--color-sage` y `--color-chart-2`, con el texto oscuro que lleva encima (`--color-on-sage`, `--color-on-chart-2`) a ≥ 4,5:1; SI un elemento usaba sage como único indicador sin texto (subrayado activo de la navegación, barra del hover de la fila), ENTONCES DEBERÁ pasar a `--color-sage-text`, que da ≥ 3:1 sobre fondo y superficie; el borde discontinuo de los tramos no alcanzados en claro DEBERÁ usar `--color-border-control`; la limitación de contraste no textual del relleno (1,6:1 contra el fondo) DEBERÁ quedar anotada en `DESIGN.md` y `MEMORY.md`, con el inventario de usos.
- RF4 (info y azules del chart): MIENTRAS esté activo el tema claro, el sistema DEBERÁ aclarar `--color-info` y `--color-chart-3` (propuesto `#38BDF8`) con el texto oscuro encima a ≥ 4,5:1, ajustar `--color-info-bg` y `--color-info-text` (propuestos `#38BDF826` y `#075985`) para que el texto de chips y avisos info siga ≥ 4,5:1 sobre su fondo, sobre la superficie y sobre el fondo de página, y mantener los pares de contraste del test de la 008 en verde; en la barra de tramos, el separador de 2 px `--color-surface` entre segmentos adyacentes DEBERÁ conservarse en ambos temas (entre sage e info el contraste directo es 1,1:1).
- RF5 (línea de elevación del botón de tema): MIENTRAS esté activo cualquier tema, el sistema DEBERÁ mostrar en el botón activo del selector sol/luna la línea de elevación actual (una sombra interior inferior de 3 px, `inset 0 -3px 0`) con el color de un token propio `--color-toggle-line` (oscuro: `#FFFFFF`, el valor actual; claro: derivado, `#047857`) en lugar de `--color-on-action`, con ≥ 3:1 sobre el relleno del botón activo y sobre la superficie y el fondo que la rodean, sin colores escritos a mano.

### B. Lista de clientes
- RF6 (botones de acción de fila): CUANDO se muestre una fila de la lista, los dos botones de acción ("Editar" y "Borrar"), que van dentro de la lista sobre `--color-surface`, DEBERÁN tener fondo `--color-bg` (`background-color: var(--color-bg)`), borde de 1 px `--color-border-control` (el fondo frente a la superficie da solo 1,2:1, así que el límite del botón lo da el borde: ≥ 3:1 sobre la superficie, 4,8:1 en claro), hover con `--color-secondary-hover` sobre ese fondo, y conservar su altura de 44 px, su nombre accesible con la empresa y el foco de la 008; en oscuro el fondo es `--color-bg` oscuro con el mismo borde.
- RF7 (paginación, fondo): CUANDO la paginación tenga controles, que van sobre el fondo de página, los botones no activos (Anterior, Siguiente y números) DEBERÁN mostrar fondo `--color-surface` (blanco de tarjeta en claro; en oscuro, su equivalente `--color-surface`) y borde de 1 px `--color-border-control` (el relleno frente al fondo da 1,2:1; el límite lo da el borde, 3,9:1 sobre el fondo en claro y 4,1:1 en oscuro), hover con `--color-hover` y borde `--color-text`; el activo conserva su resalte no solo por color (`aria-current`, relleno `--color-action` y texto `--color-on-action`) y el deshabilitado sigue al 40 % de opacidad.
- RF8 (paginación, separación): CUANDO la paginación tenga controles, el hueco entre ellos (Anterior, 1, 2, Siguiente) DEBERÁ ser como mínimo `--space-md` (16 px), sin desbordamiento horizontal a 360 px (los controles pueden saltar de línea).
- RF9 (columna Simulaciones): CUANDO se muestre la lista, en tabla (768 px o más) y también apilada (menos de 768 px), la celda de "Simulaciones" DEBERÁ mostrar solo el número (Fira Code, cifras tabulares) y la palabra "Simulaciones" solo en la cabecera de la tabla, sin etiqueta visible en el formato apilado; su contexto accesible DEBERÁ venir de la cabecera de columna (que sigue expuesta, oculta solo visualmente, 008 RF55), de modo que un lector lea "Simulaciones: 12" una sola vez, sin texto adicional duplicado en la celda; SI la cabecera no estuviera expuesta en algún formato, ENTONCES la celda DEBERÁ llevar un `aria-label` con plural ("1 simulación", "12 simulaciones") solo en ese formato.
- RF10 (País y NIF separados): CUANDO se muestre la lista, el sistema DEBERÁ mostrar "País" (bandera e ISO, con su fallback de la 007) y "NIF" (Fira Code) en dos columnas con cabecera propia, en el orden Empresa (con correo), País, NIF, Plan, Simulaciones, Alta, Acciones; en el formato apilado cada dato DEBERÁ ir en su propia celda con su etiqueta visible, con una excepción explícita: "Simulaciones" no lleva etiqueta visible (RF9); el NIF y el correo siguen seleccionables y la fila sigue siendo un único enlace accesible (008, RF19 y RF55).
- RF11 (color por plan): CUANDO se muestre un plan (lista y detalle), el sistema DEBERÁ pintar su chip con un color propio por plan (starter, growth, enterprise) definido por tokens (tabla de plan: starter con el azul info, growth con el sage, enterprise con el navy del tema), con fondo sutil y texto ≥ 4,5:1 sobre fondo y superficie en ambos temas; los colores de estado (éxito, aviso, error) NO DEBERÁN usarse para los planes. Criterios medibles: (a) el chip muestra siempre el nombre del plan como texto ("Starter", "Growth", "Enterprise"), por lo que el plan nunca depende solo del color; (b) un test comprueba que los tres tokens de fondo y los tres de texto son distintos entre sí en ambos temas; (c) el test de contraste cubre los pares de la tabla de plan. Enmienda la decisión "chips de plan neutros" de la 008 (RF12).

### C. Cabecera
- RF12 (flecha del desplegable): CUANDO se muestre el selector de divisa de la cabecera, la flecha DEBERÁ ser el mismo chevron propio que usa "Simulaciones guardadas", con una única geometría SVG como fuente de verdad (la de `ui/icons`), conservando la separación de ≥ 16 px del borde derecho y el relleno de la 008 (RF39). Mecanismo: en botones y desplegables propios, el SVG en línea con `currentColor` y `aria-hidden`; en `<select>` nativos (cabecera, país y plan), el chevron en el contenedor del campo con una máscara CSS (`mask-image` con `-webkit-mask-image`, una data-URI con la misma geometría y sin ningún color literal) y `background-color` de un token (`--color-text-muted`; `--color-text` en hover; `--color-focus` con foco visible). MIENTRAS el `select` esté deshabilitado, el chevron DEBERÁ atenuarse al 40 % como el campo. SI está activo `forced-colors`, ENTONCES el chevron DEBERÁ seguir visible (`forced-color-adjust: none` con color de sistema `ButtonText`, permitido por la 008 RF3, y la máscara intacta). El chevron NO DEBERÁ recibir eventos de puntero.
- RF13 (botón claro/oscuro): ver RF5.

### D. Detalle de cliente
- RF14 (plan junto al nombre): CUANDO se muestre el detalle, el chip de plan DEBERÁ ir en la fila del nombre (h1), justo a su lado y no al final de la línea de datos; en pantallas estrechas DEBERÁ saltar de línea sin desplazamiento horizontal.
- RF15 (datos con icono): CUANDO se muestre el detalle, DEBERÁ mostrar bajo el nombre, en una línea que salta de línea, país (bandera e ISO), NIF, correo y fecha ("Cliente desde {fecha}"), cada uno precedido de un icono SVG en línea propio (`aria-hidden`, `currentColor`, sin dependencias nuevas), con el dato en texto visible; el correo y el nombre largos se parten sin desbordar (008, RF35).
- RF16 (botón Presentar): CUANDO se muestre el botón de modo presentación, su texto visible DEBERÁ ser "Presentar" y el atajo "Alt+P" DEBERÁ mostrarse en un tooltip (componente de la 008, RF14, con `role="tooltip"` y `aria-describedby` en el botón) tanto al pasar el ratón como al recibir el foco de teclado; el botón DEBERÁ conservar `aria-keyshortcuts="Alt+P"`, el nombre accesible DEBERÁ contener el texto visible, y el foco, el anuncio y el atajo de la 008 (RF47 y RF48) siguen igual; "Salir de la presentación" NO cambia. Enmienda el texto "Modo presentación (Alt+P)" de la 008. El atajo real ya es Alt+P (`event.code === 'KeyP'`): `MEMORY.md` D16 dice todavía "modo presentación (`P`)" y DEBE corregirse a Alt+P.
- RF17 (título de guardadas): CUANDO se muestren las simulaciones guardadas, el título DEBERÁ ser "Simulaciones guardadas (N)" con N entre paréntesis junto al título, en cifras tabulares, y el subtítulo "N simulaciones" DEBERÁ desaparecer; con 0 simulaciones, "(0)" y el estado vacío existente.
- RF18 (despliegue animado): CUANDO el usuario despliegue o pliegue el detalle de una simulación guardada, el sistema DEBERÁ animar la altura del detalle (transición de `grid-template-rows` entre `0fr` y `1fr` sobre un contenedor interior, más opacidad, ≤ 300 ms) y girar el mismo chevron por `transform` sin intercambiar iconos, conservando `aria-expanded`, `aria-controls` y el foco; el detalle plegado NO DEBERÁ ser alcanzable con teclado ni leído por lectores: DEBERÁ marcarse `inert` desde el inicio del plegado y quedar oculto (`visibility: hidden`, tras la transición) al terminar, y recuperar `inert` y visibilidad al inicio del despliegue; SI el usuario alterna a mitad de una transición, ENTONCES el sistema DEBERÁ invertirla desde la altura actual sin salto ni doble alternancia; SI el usuario tiene `prefers-reduced-motion: reduce`, ENTONCES DEBERÁ abrir y cerrar sin animación (el chevron cambia de posición al instante).
- RF19 (gráfico de tramos): CUANDO cambie el número de usuarios, la barra de tramos (y, si aplica, los cuadros de la escalera) DEBERÁ transicionar suavemente (≤ 300 ms) en el ancho de los segmentos; un segmento que entra (tramo que pasa de 0 a más de 0 usuarios o céntimos) DEBERÁ crecer desde ancho 0 y uno que sale DEBERÁ encogerse hasta 0 y desmontarse al terminar; la decisión de nombre completo, abreviatura o sin texto (008, RF41 y RF50) DEBERÁ tomarse con el ancho final calculado a partir del reparto de los datos y del ancho (sin animar) de la barra, no con una medida tomada a mitad de la transición, sin parpadeo, sin remontar segmentos ni perder el foco; los segmentos de 0 usuarios o 0 céntimos siguen sin dibujarse al terminar y el total y la tabla NO DEBERÁN animarse; SI el usuario tiene `prefers-reduced-motion: reduce`, ENTONCES DEBERÁ cambiar sin transición.
- RF20 (botón Guardar): CUANDO se muestre el botón de guardado de la hoja, su texto visible DEBERÁ ser "Guardar" con un icono SVG en línea, con nombre accesible "Guardar simulación" (contiene el texto visible); durante el envío, "Guardando…" sustituye a "Guardar" y el icono no se muestra; el `aria-disabled`, el `aria-describedby` y el anuncio "Presupuesto guardado" de la 008 (RF53) siguen igual.
- RF21 (símbolos de divisa): DESCARTADO: la API no los ofrece. La respuesta de `GET https://open.er-api.com/v6/latest/EUR` contiene `result`, `base_code`, `rates` (código ISO a número) y marcas de tiempo y enlaces del proveedor (el adaptador del backend solo lee `result`, `base_code` y `rates`; el plan de la 007 documenta los mismos campos), sin símbolo ni nombre de divisa. No se añade otra fuente (decisión del usuario) y la interfaz sigue mostrando el código ISO y el nombre de la lista fija de `shared/`. Esta conclusión se ha obtenido del código y de la documentación del proyecto, sin llamada a la red en esta sesión; si se quiere confirmar con la respuesta real, basta una petición manual.

### E. Formularios Nuevo cliente y Editar cliente (ambos)
- RF22 (tarjeta centrada): CUANDO se muestre el formulario de alta o de edición, el sistema DEBERÁ ponerlo dentro de una tarjeta (componente de la 008, RF11) centrada horizontalmente en la pantalla en cualquier ancho (no en vertical), con ancho máximo de lectura de 560 px y sin pegarse a un lateral; el título de la página (h1), los botones ("Guardar" y "Cancelar" si existe) y los errores del formulario (por campo, "Ver el cliente existente", de red o de cliente no encontrado) DEBERÁN estar dentro de la tarjeta; a 360 px la tarjeta ocupa el ancho útil con sus márgenes sin desbordar.
- RF23 (sin subtítulos ni agrupación redundante): CUANDO se muestre el formulario, los títulos de grupo "Empresa", "Contacto y plan" (y cualquier "Contacto" o "Plan" como subtítulo) NO DEBERÁN mostrarse y NO DEBERÁ haber `fieldset` ni `legend` (ni siquiera ocultos) que repitan lo que ya dicen las etiquetas; las etiquetas de los campos (Empresa, País, NIF, Correo, Plan) se conservan y bastan como nombre accesible de cada control. Enmienda la 008 (RF30), que agrupaba el formulario en "Empresa" y "Contacto y plan".
- RF24 (flecha de los select): CUANDO se muestre un `<select>` del formulario (país y plan), la flecha DEBERÁ ser el mismo chevron del RF12, con el mismo mecanismo, estados y la separación de ≥ 16 px del borde sin solapar el texto (008, RF39).
- RF25 (Guardar): CUANDO se muestre el botón de envío del alta o de la edición, su texto visible DEBERÁ ser "Guardar" con icono (ya no "Crear cliente" ni "Guardar cambios") y su nombre accesible DEBERÁ ser ese mismo texto, "Guardar"; durante el envío, "Guardando…" sustituye a "Guardar" y el icono no se muestra; los títulos de página ("Nuevo cliente", "Editar cliente") se mantienen; el estado de envío, la prevención de doble envío y los errores de la 009 siguen igual. Enmienda la 009 (RF7).

### Transversales
- RF26 (fuente única de tokens): CUANDO se complete la spec, todos los tokens nuevos o modificados DEBERÁN estar en el bloque css de `DESIGN.md` y ser idénticos a `tokens.css` (test `design-tokens` en verde); NO DEBERÁ haber un color, sombra, radio o familia literal fuera de tokens (tampoco en la data-URI de la máscara del chevron ni en el script en línea de `index.html`); el espaciado nuevo (RF8) DEBERÁ usar la escala.
- RF27 (contraste y tests): CUANDO se ejecuten los tests, el test de contraste DEBERÁ cubrir en ambos temas los pares nuevos de las tablas (texto sobre sage, info y chart-3; texto de chips y avisos sobre fondo y superficie; chips de plan; `--color-toggle-line`; borde frente al fondo; hovers y pulsados con texto muted; selección) y las pruebas de la lista, el detalle, la hoja y los formularios DEBERÁN adaptarse a los textos nuevos sin retirar la cobertura de usuarios 0, 1, 10, 11, 50 y 51, ni la de los plurales.
- RF28 (movimiento): SI el usuario tiene movimiento reducido, ENTONCES todas las transiciones nuevas (RF18 y RF19) DEBERÁN quedar suprimidas, con el mismo mecanismo que la 008 (RF34).
- RF29 (sin regresión y documentación): CUANDO se complete la spec, DEBERÁN pasar `npm test` y `npm run lint`, sin dependencias nuevas y sin cambios en `shared/` ni `backend/`; las funciones, rutas, API y datos NO DEBERÁN cambiar; el script en línea del `<head>` de `index.html` (hoy solo fija `data-theme` y no pinta ningún fondo literal) NO DEBERÁ introducir ningún color literal y, si pre-pintara el fondo, DEBERÁ usar tokens; `DESIGN.md` DEBERÁ describir los cambios (fondo, jerarquía de superficies, planes, iconos y chevron, tarjeta del formulario, botones "Presentar" y "Guardar") y `MEMORY.md` DEBERÁ registrar las decisiones (D6 actualizada, D16 con el atajo Alt+P, limitación de contraste e inventario, resultado del punto 21) y cerrar la auditoría pendiente. Enmiendas que DEBEN anotarse en las specs afectadas: 008 (RF12, RF19, RF21/RF40, RF30, RF39, RF48) y 009 (RF7).

## Casos límite (tabla entrada → salida esperada)
| Entrada | Salida esperada |
|---|---|
| Tema claro, página sin tarjetas | Fondo `#E9E9E9`; texto principal ≥ 4,5:1 |
| Tema claro, tarjeta blanca sobre el fondo | Borde `#94A3B8` visible (≥ 2:1 sobre el fondo); controles con borde ≥ 3:1 |
| Texto oscuro sobre sage `#34D399` y sobre info `#38BDF8` | 9,3:1 y 8,3:1 |
| Relleno sage o info frente al fondo claro | 1,6:1 y 1,8:1: no cumple 3:1; aceptado porque lleva nombre en texto (limitación declarada) |
| Subrayado de la navegación activa en claro | Usa `--color-sage-text` (≥ 3:1 sobre el fondo) |
| Cambiar de tema con el botón luna/sol | La línea de elevación se ve en ambos temas |
| Hover y pulsado de una fila de clientes en claro | Fila `#EEF1F5` sobre blanco, borde visible y barra `--color-sage-text`; pulsada algo más oscura; texto muted ≥ 4,5:1 |
| Hover de un botón fantasma o secundario sobre el fondo y sobre la superficie | Se distingue en ambos (≥ 1,1:1) con texto muted ≥ 4,5:1 |
| Fila con dos botones de acción en claro y en oscuro | Fondo `--color-bg`, borde de control visible (≥ 3:1), hover visible y nombre accesible con la empresa |
| Paginación con Anterior, 1, 2, Siguiente a 360 px | Fondo `--color-surface` y borde de control sobre el fondo de página; hueco ≥ 16 px; sin scroll horizontal; saltan de línea si no caben |
| Primera y última página | Anterior o Siguiente deshabilitados al 40 %, siguen con fondo y borde |
| Cliente con 0 y con 1 simulación | Columna: "0" y "1"; el lector lee "Simulaciones: 0" y "Simulaciones: 1" con la cabecera, sin duplicar |
| Cliente con 12 simulaciones a 360 px (apilado) | Solo "12" visible, sin etiqueta; el lector lee "Simulaciones: 12" por la cabecera oculta solo visualmente |
| Cliente ES con NIF `12345678Z`, CIF `A58818501` o NIE `X1234567L`; cliente US | NIF en su columna, en Fira Code, sin cambios de formato; US sin NIF obligatorio muestra el dato existente |
| Cliente sin NIF visible o con país sin bandera | Solo el ISO en País; NIF vacío sin hueco roto |
| Plan starter, growth y enterprise en claro y en oscuro | Tres chips con fondos y textos distintos, nombre en texto, contraste ≥ 4,5:1 sobre fondo y superficie |
| Nombre de 100 caracteres sin espacios y correo largo a 360 px | Nombre y plan envuelven; datos con iconos saltan de línea; sin scroll horizontal |
| Botón "Presentar" con ratón, con Tab y con Escape sobre el tooltip | Tooltip "Alt+P" tanto al hover como al foco, enlazado con `aria-describedby`; Escape lo cierra sin salir de nada; Alt+P sigue funcionando |
| "Simulaciones guardadas" con 0, 1 y 14 simulaciones | "(0)" con vacío, "(1)", "(14)", sin subtítulo |
| Desplegar y plegar una simulación guardada | Altura y chevron animados; con movimiento reducido, al instante; el plegado no es enfocable ni se lee |
| Alternar el detalle a mitad de la animación | La transición se invierte desde la altura actual, sin salto; `aria-expanded` coherente |
| Usuarios 0, 1, 10, 11, 50 y 51 en la barra de tramos | Segmentos que crecen desde 0 o se encogen hasta 0; texto decidido con el ancho final; 0 usuarios sin segmentos; total y tabla correctos y sin animar |
| Tramos 2 y 3 adyacentes en claro (por ejemplo 51 usuarios) | Separador de 2 px `--color-surface` visible entre sage e info; cada uno con su nombre |
| Cambio rápido del slider de 9 a 11 y de 49 a 51 | Sin parpadeo de texto ni foco perdido; sin movimiento con movimiento reducido |
| Escalera con tramos no alcanzados en claro | Borde discontinuo `--color-border-control` (≥ 3:1 sobre `--color-surface-2`), texto muted y "no alcanzado" para lectores |
| Selección de texto sobre fondo, superficie y fila en hover, en claro | Texto legible (≥ 4,5:1 sobre la selección) |
| Modo presentación en tema claro (×1,25) | Fondo `#E9E9E9`, hoja blanca, escalera y barra con los colores nuevos, textos ≥ 4,5:1; barra mínima con el selector de divisa y su chevron |
| Select de país con un nombre largo a 360 px (por ejemplo "Reino Unido") y chevron | El texto no se solapa con el chevron ni desborda el campo; chevron a ≥ 16 px del borde |
| Select deshabilitado, con hover, con foco y con `forced-colors` | Chevron atenuado al 40 %, en `--color-text`, en `--color-focus` y visible con `ButtonText`, respectivamente |
| Script de tema del `<head>` con `som-theme` ausente, `dark` o `light` | Fija `data-theme` antes del primer pintado (oscuro por defecto) sin color literal; en claro no hay parpadeo del fondo antiguo |
| Divisa no disponible (tipos caídos) | El selector del header conserva el chevron, deshabilitado con "Reintentar"; no se muestra ningún símbolo |
| Divisa disponible (CHF, SEK…) | Código y nombre de la lista fija; sin símbolo (la API no lo ofrece) |
| IVA con redondeo half-up (por ejemplo base 1 € al 21 %) | Importes idénticos a los actuales (no hay cambios de cálculo) |
| Formulario de alta y de edición a 360 px y 1440 px | Tarjeta centrada en horizontal, ≤ 560 px, con título, botones y errores dentro; sin subtítulos ni `fieldset`; selects con el chevron nuevo |
| Envío en curso del formulario | "Guardando…" sin icono, deshabilitado, sin doble envío |

## Criterios de aceptación
- CA1: `tokens.css` y el bloque de `DESIGN.md` son idénticos, con `--color-bg` claro exactamente `#E9E9E9` y los valores de las tablas de color; el test de contraste cubre todos los pares nuevos en ambos temas y pasa (≥ 4,5:1 para texto; 3:1 solo donde se declara, con la limitación y su inventario anotados).
- CA2: los 25 puntos del archivo de la auditoría tienen su RF (el 13 remite al RF5 y el 21 queda descartado con la razón del RF21); cada uno se comprueba en el navegador a 360, 768, 1024 y 1440 px, en ambos temas y, donde aplique, en modo presentación.
- CA3: la lista muestra País y NIF en columnas separadas, "Simulaciones" solo con número (también apilada) y accesible sin duplicados, botones de fila con fondo `--color-bg` y borde, paginación con fondo `--color-surface` y borde, hueco ≥ 16 px y chips de plan con tres colores distintos.
- CA4: el detalle muestra nombre y plan en la misma fila, datos con iconos, "Presentar" con tooltip "Alt+P" (hover y foco), "Simulaciones guardadas (N)", animaciones de despliegue y de barra, "Guardar" con icono, sin scroll horizontal a 360 px.
- CA5: los formularios de alta y edición están en una tarjeta centrada en horizontal con título, botones y errores dentro, sin subtítulos ni `fieldset`, con "Guardar" e icono y el mismo chevron que la cabecera en todos los `<select>` (también deshabilitado, hover, foco y `forced-colors`).
- CA6: con `prefers-reduced-motion: reduce` no hay ninguna animación nueva.
- CA7: `npm test` y `npm run lint` pasan, no hay dependencias nuevas ni cambios en `shared/` o `backend/`, y la cobertura de usuarios 0, 1, 10, 11, 50 y 51 se mantiene.

## Fuera de alcance
- Cambiar funciones, rutas, API, base de datos, cálculo de tramos o IVA.
- Añadir otra fuente de símbolos de divisa o librerías de iconos o de animación.
- Cambios en el tema oscuro, salvo los tokens nuevos de plan y la línea del botón de tema.
- Rediseñar otras pantallas (cabecera completa, hoja de presupuesto, diálogo de borrado) o la escalera de tramos más allá de su transición.
- Verificación manual con lector de pantalla, `forced-colors`, zoom del 200 % y dispositivo táctil real (siguen pendientes, ver `MEMORY.md`).
