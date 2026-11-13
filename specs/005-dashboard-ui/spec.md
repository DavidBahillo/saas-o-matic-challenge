# 005 · Dashboard de clientes y simulador
Estado: aprobada

> **Importes:** la interfaz recibe y muestra céntimos enteros (D2). Esta spec los redacta en la unidad natural (€, USD, GBP), como las anteriores. Las cifras de los casos límite coinciden con las de la 002 y la 004.

## Contexto y objetivo (por qué)
El backend ya valida clientes (001), calcula el precio por tramos con IVA (002), guarda simulaciones congeladas (003) y las convierte a USD o GBP (004). Falta la interfaz que usa el equipo comercial: hoy solo se puede trabajar con la API.

Esta spec crea el `frontend/` (D11) como un dashboard en modo oscuro por defecto (D6, `DESIGN.md`) con tres usos: encontrar un cliente, darlo de alta con los errores de su identificador fiscal por campo, y simular una suscripción moviendo un control de usuarios con el total siempre a la vista. El total mensual es el elemento más visible (`DESIGN.md`).

Principios que condicionan la spec:
- La interfaz no es fuente de verdad. Calcula con la regla compartida de `shared/` solo para mostrar al instante (D3); el valor lo da lo que el backend recalcula y congela al crear (principio 3). La conversión de divisa en pantalla es solo vista previa, sin valor ni persistencia (principio 2, enmendado en la 004).
- Toda pantalla muestra estados de carga, error y vacío (principio 8).
- Español únicamente, sin i18n. Sin edición ni borrado: la API no los ofrece (D14).

## Decisiones del usuario (13 nov 2026)
- U1 · Alcance: lista y detalle de clientes, alta de cliente (`POST /customers`, con errores de tax ID por campo) y simulador que crea simulaciones (`POST /simulations`) desde el detalle. Sin edición ni borrado. *Descartado:* solo lectura, y solo lectura más alta.
- U2 · Divisas del selector: solo EUR, USD y GBP. Se corrige `DESIGN.md` para quitar CHF y JPY. *Descartado:* mostrar CHF y JPY deshabilitadas.
- U3 · Contador de simulaciones: el backend añade `simulationCount` al cliente (`GET /customers`, `GET /customers/:id` y, por coherencia, el alta). Esto **enmienda los contratos de las specs 001 y 003** (ver "Enmienda de contratos"). *Descartado:* quitar el contador, y N+1 peticiones desde la interfaz.
- U4 · Navegación: el buscador del header filtra clientes con `GET /customers?q=`; la lista de clientes es la pantalla de inicio; rutas por URL (`/customers/:id`). *Descartado:* pantalla de KPI global (la API no tiene agregados) y una sola pantalla con paneles.
- U5 · Idioma y extras: solo español. Un único gráfico: barra apilada de tramos más IVA con la tabla unidades × precio. Entran el tema claro/oscuro, el modo presentación (tecla `P`) y la vista previa convertida con `GET /exchange-rates`. *Descartado:* i18n y gráficos de tendencia.
- U6 · Comunicación: el frontend llama a `/api/...` y el servidor de desarrollo de Vite lo reenvía al backend quitando el prefijo `/api`. No hay CORS y el backend no cambia, salvo `simulationCount`. *Descartado:* habilitar CORS en el backend.
- U7 · Fallo de tipos de cambio: USD y GBP quedan deshabilitadas con un botón "Reintentar", sin reintentos automáticos. No hay aviso de tipo caducado, porque el backend nunca sirve tipos caducados (RF16 de la 004). *Descartado:* reintento automático y aviso a las 24 h.

## Valores por defecto adoptados (a revisar en la aprobación)
Son decisiones razonables del planner, no del usuario.
- V1 · Rutas: `/` (lista de clientes), `/customers/new` (alta) y `/customers/:id` (detalle y simulador). Cualquier otra ruta muestra una pantalla "No encontrado" con enlace al inicio.
- V2 · El buscador del header espera 300 ms tras la última pulsación antes de pedir y descarta respuestas de búsquedas anteriores.
- V3 · La lista muestra hasta 50 clientes (límite de la 001) y el texto "Mostrando N de TOTAL" cuando `total` es mayor.
- V4 · Slider de 0 a 100 con paso 1 y marcas en 10 y 50. El campo numérico admite de 0 a 100 000. Valor inicial del simulador: 10 usuarios.
- V5 · El pie "Tipos actualizados: hh:mm" usa la hora local del navegador (formato 24 h) y muestra la hora **más antigua** de los `exchangeRateAt` recibidos.
- V6 · Los datos de la lista y del detalle se piden al entrar y al volver a la pantalla; no hay refresco periódico. Los tipos de cambio se piden una vez al arrancar la aplicación.
- V7 · El texto de `aria-live` espera 500 ms de calma antes de anunciarse, para no anunciar cada paso del slider (`polite`).
- V8 · Las fechas se muestran en la hora local del navegador, con formato `es-ES` ("13 nov 2026, 09:30").

## Glosario
- **Cliente:** el de la 001, con `simulationCount` (RF1).
- **Simulador:** panel del detalle del cliente con usuarios, almacenamiento, llamadas a la API y el total.
- **Vista previa:** importes calculados en la interfaz con las funciones de `shared/` antes de guardar. No vale nada.
- **Presupuesto guardado:** simulación devuelta por el backend (003 y 004), con importes congelados.
- **Divisa activa:** la del selector del header. Solo afecta a la vista previa del simulador y a la divisa que se envía en el `POST /simulations` de una simulación nueva (la que esté seleccionada al pulsar "Guardar"). Los presupuestos guardados se muestran siempre en su propia divisa, sin reconvertir.

## Requisitos funcionales (EARS)

### Backend: contador de simulaciones (enmienda 001 y 003)
- RF1: El sistema DEBERÁ incluir `simulationCount` (entero ≥ 0) en cada cliente de `GET /customers`, `GET /customers/:id` y en la respuesta 201 de `POST /customers` (valor 0), igual al número de simulaciones guardadas de ese cliente. El tipo `Customer` de `shared/` DEBERÁ ampliarse con ese campo, de modo que backend y frontend usen la misma forma. `simulationCount` es solo de salida: en el cuerpo de `POST /customers` se rechaza como campo desconocido (`UNKNOWN_FIELD`).
- RF2: CUANDO se crea una simulación con éxito, el sistema DEBERÁ reflejarla en el `simulationCount` del cliente en la lectura siguiente. Una petición rechazada (400, 404 o 500) no lo cambia.
- RF3: El sistema DEBERÁ calcular `simulationCount` en cada lectura, sin guardarlo como dato duplicado que pueda desincronizarse, y sin cambiar el orden del listado (colación española y desempate por id, D11), la búsqueda ni el límite de 50 resultados.

**Enmienda de contratos.** Esta spec modifica de forma explícita la forma del cliente de la 001 (respuestas de `GET /customers`, `GET /customers/:id` y 201 de `POST /customers`, y su entrada: `simulationCount` pasa a campo desconocido) y la lectura de simulaciones de la 003 (el contador depende de ellas). Al aprobarla se anotará en `MEMORY.md` (D16) y en las specs 001 y 003. Los tests de ambas se ajustan solo en ese campo.

### Comunicación con el backend
- RF37: El frontend DEBERÁ llamar siempre a rutas que empiecen por `/api` y el servidor de desarrollo DEBERÁ reenviarlas al backend quitando ese prefijo (U6), sin CORS. El paquete `frontend` DEBERÁ formar parte de los workspaces del monorepo y entrar en los scripts `dev`, `lint` y `test` de la raíz, de modo que `npm run dev` levante backend y frontend. La dirección del backend es configurable por variable de entorno, con un valor por defecto para desarrollo.

### Lista de clientes (inicio)
- RF4: CUANDO el usuario abre `/`, el sistema DEBERÁ pedir `GET /customers` y mostrar una tarjeta por cliente con empresa, identificador fiscal con badge de país, email, chip con el plan y `simulationCount` con su texto ("1 simulación", "N simulaciones").
- RF5: MIENTRAS la lista se carga, el sistema DEBERÁ mostrar skeletons. SI la petición falla, ENTONCES DEBERÁ mostrar el mensaje de error, borde `--error` y un botón "Reintentar" que repite la petición. SI no hay clientes, ENTONCES DEBERÁ mostrar el estado vacío con la llamada a la acción "Dar de alta un cliente".
- RF6: CUANDO el usuario escribe en el buscador del header, el sistema DEBERÁ pedir `GET /customers?q=<texto>` y sustituir la lista por las coincidencias, con la regla de espera de V2. SI no hay coincidencias, ENTONCES DEBERÁ mostrar el vacío "Sin resultados para «texto»" con la opción de borrar la búsqueda. CUANDO el texto queda vacío o solo con espacios, DEBERÁ volver a la lista completa. La búsqueda DEBERÁ reflejarse en la URL (`/?q=texto`), de modo que recargar la página o compartir el enlace la conserva, y el campo DEBERÁ limitar la entrada a 100 caracteres (`maxLength`).
- RF7: CUANDO el usuario escribe en el buscador desde cualquier pantalla distinta de `/`, el sistema DEBERÁ llevarlo a `/?q=...` con la búsqueda aplicada.
- RF8: SI el total de coincidencias es mayor que el número de tarjetas, ENTONCES el sistema DEBERÁ indicarlo (V3).
- RF9: CUANDO el usuario activa una tarjeta (ratón o teclado), el sistema DEBERÁ ir a `/customers/:id`.

### Alta de cliente
- RF10: CUANDO el usuario abre `/customers/new`, el sistema DEBERÁ mostrar un formulario con empresa, país (selector con la lista de códigos de país de `shared/`, sin duplicarla), identificador fiscal, email y plan (`starter`, `growth` o `enterprise`, de `shared/`).
- RF11: CUANDO el usuario envía el formulario, el sistema DEBERÁ enviar `POST /customers` con los valores tal cual los escribió, sin normalizarlos ni validar el identificador fiscal por su cuenta (la validación oficial la hace el backend, principio 4). Un campo vacío DEBERÁ enviarse como cadena vacía (`""`), no omitirse, y el código de error lo decide el backend. DEBERÁ mostrar un estado de envío que impida un segundo envío.
- RF12: SI el backend responde 400 `VALIDATION_ERROR`, ENTONCES el sistema DEBERÁ mostrar cada error de `details.fields[]` junto al control que le corresponde según la tabla de abajo, con el mensaje del backend y, cuando exista, la `suggestion` (por ejemplo, "¿Querías decir GB?"); DEBERÁ conservar lo escrito y llevar el foco al primer control con error. El `reason` DEBERÁ traducirse con un mapa propio de la interfaz a un mensaje en español; SI el `reason` no está en el mapa, ENTONCES DEBERÁ usar el `message` del backend. Cualquier otro 400 (`UNSUPPORTED_CONTENT_TYPE`, `PAYLOAD_TOO_LARGE`, `MALFORMED_JSON`), y cualquier error de campo cuyo `field` no esté en la tabla (incluido `UNKNOWN_FIELD`), DEBERÁ mostrarse como aviso general del formulario.

| `field` del backend | Control del formulario |
|---|---|
| `companyName` | Empresa |
| `country` | País |
| `taxId` | Identificador fiscal |
| `email` | Email |
| `plan` | Plan |
| cualquier otro | Aviso general del formulario |

- RF13: SI el backend responde 409 `CUSTOMER_ALREADY_EXISTS`, ENTONCES el sistema DEBERÁ mostrar el mensaje y un enlace al cliente existente (`details.existingId`).
- RF14: SI el alta falla por otro motivo (500 o sin conexión), ENTONCES el sistema DEBERÁ mostrar un error general con "Reintentar" y conservar lo escrito.
- RF15: CUANDO el backend responde 201, el sistema DEBERÁ ir a `/customers/:id` del cliente creado y la lista de clientes deberá mostrarlo sin recargar la página (invalidando su consulta).

### Detalle del cliente y simulaciones guardadas
- RF16: CUANDO el usuario abre `/customers/:id`, el sistema DEBERÁ pedir el cliente y sus simulaciones (`GET /customers/:id/simulations`) y mostrar los datos del cliente y la lista de simulaciones (usuarios, divisa, total convertido, fecha), de la más reciente a la más antigua.
- RF17: SI el cliente no existe (404 `CUSTOMER_NOT_FOUND`) o el `id` de la URL no es válido (400 `INVALID_ID`), ENTONCES el sistema DEBERÁ mostrar "Cliente no encontrado" con enlace a la lista. SI falla la carga por otro motivo, ENTONCES DEBERÁ mostrar el error con "Reintentar". MIENTRAS carga, skeletons. SI el cliente no tiene simulaciones, ENTONCES DEBERÁ mostrar el vacío con la llamada a la acción "Crear la primera simulación".
- RF18: CUANDO el usuario abre una simulación guardada, el sistema DEBERÁ mostrar sus importes tal como los devolvió el backend (RF19 de la 004): tramos en euros, base, IVA y total en euros, y la divisa, el tipo y su fecha con los importes convertidos. Cada presupuesto guardado se muestra siempre en su propia divisa, sin recalcular ni reconvertir nada y sin que le afecte la divisa activa.

### Simulador
- RF19: MIENTRAS el usuario mueve el control de usuarios, el sistema DEBERÁ recalcular la vista previa en cada cambio con la regla compartida de `shared/` (la misma que usa el backend) para el país del cliente, sin llamar al backend, y mostrar el total mensual como el elemento más grande de la pantalla (48 px, `tabular-nums`).
- RF20: El control de usuarios DEBERÁ ser un slider de 0 a 100, con paso 1 y marcas en 10 y 50, enlazado con un campo numérico que admite de 0 a 100 000 usuarios. El slider DEBERÁ manejarse con teclado (flechas, Inicio, Fin, Re Pág y Av Pág); mover el slider escribe su valor en el campo. SI el valor del campo es mayor que 100, ENTONCES el slider DEBERÁ quedar en su máximo (100) sin cambiar el valor del campo. El campo numérico DEBERÁ interpretarse así: se recortan los espacios de los extremos; el resto DEBERÁ ser solo dígitos (`^[0-9]+$`, sin signo, decimales, exponente, separadores ni espacios internos) y valer un entero de 0 a 100 000; los ceros a la izquierda se admiten (`0010` es 10). SI el texto no cumple eso (incluido vacío), ENTONCES DEBERÁ mostrar el error de validación del campo, mantener la vista previa con el **último valor válido**, dejar slider y total en ese valor y deshabilitar "Guardar".
- RF21: El simulador DEBERÁ mostrar el desglose como una barra apilada con los tres tramos (`--primary`, `--secondary` y `--tertiary`) más el IVA en `--text-muted`, con etiqueta de texto en cada segmento (el color nunca es el único portador, `DESIGN.md`), y una tabla con unidades × precio = subtotal por tramo, base, tipo de IVA, IVA y total. La tabla siempre muestra los tres tramos, también los de 0 unidades. SI un segmento es demasiado estrecho para su etiqueta (menos del 12 % del ancho de la barra), ENTONCES la etiqueta DEBERÁ ir fuera del segmento, bajo la barra, sin solaparse ni cortarse. Los anchos son proporcionales al total (base más IVA) y los segmentos de 0 no se dibujan.
- RF22: El simulador DEBERÁ permitir indicar `storage` y `apiCalls` (enteros de 0 a 1 000 000, 0 por defecto, con el mismo criterio de interpretación que RF20 salvo el rango). La interfaz DEBERÁ indicar que no suman al precio (D4).
- RF23: Al arrancar la aplicación, el sistema DEBERÁ pedir `GET /exchange-rates` una vez (V6). CUANDO la divisa activa es USD o GBP, DEBERÁ mostrar junto al total en euros una vista previa convertida con la función de conversión de `shared/`, marcada como "Vista previa", con el tipo usado. CUANDO la divisa activa es EUR, NO DEBERÁ mostrar vista previa convertida. Toda cifra lleva visible su divisa.
- RF24: SI `GET /exchange-rates` falla (500 `EXCHANGE_RATE_UNAVAILABLE`, red o respuesta inesperada), ENTONCES el sistema DEBERÁ deshabilitar USD y GBP en el selector, dejar la divisa activa en EUR, mostrar el badge `--warning` "Tipos de cambio no disponibles" con un botón "Reintentar" y NO DEBERÁ reintentar por su cuenta (U7). CUANDO el reintento tiene éxito, DEBERÁ habilitar USD y GBP sin cambiar la divisa activa. NO DEBERÁ mostrar aviso de tipos caducados: el backend nunca los sirve.
- RF25: CUANDO el usuario pulsa "Guardar simulación", el sistema DEBERÁ enviar `POST /simulations` solo con `customerId`, `users`, `storage`, `apiCalls` y `currency` (la divisa activa en ese instante), nunca con importes ni tipos (principio 3), y bloquear un segundo envío mientras la petición está en curso.
- RF26: CUANDO el backend responde 201, el sistema DEBERÁ mostrar el presupuesto guardado con los importes y el tipo del backend (RF18), que pueden diferir de la vista previa si el tipo cambió, e indicarlo ("El tipo aplicado fue 1,12, distinto del de la vista previa"). DEBERÁ invalidar las consultas del cliente, de sus simulaciones y de la lista de clientes, de modo que la simulación aparezca en la lista y `simulationCount` se actualice sin recargar la página. Los valores del simulador se conservan tras guardar.
- RF27: SI el backend responde 400 `VALIDATION_ERROR` en `POST /simulations`, ENTONCES el sistema DEBERÁ mostrar cada error junto a su control (incluido `CURRENCY_NOT_AVAILABLE` con su `suggestion`); un campo que no corresponda a ningún control se muestra como aviso general. SI responde 404 `CUSTOMER_NOT_FOUND`, ENTONCES DEBERÁ mostrar "Cliente no encontrado". SI responde 500 `EXCHANGE_RATE_UNAVAILABLE`, ENTONCES DEBERÁ explicar que no se pudo obtener el tipo, ofrecer "Reintentar" y "Guardar en EUR". En cualquier otro fallo, error general con "Reintentar". En todos los casos conserva lo introducido.
- RF38: CUANDO el usuario cambia de cliente (otra URL `/customers/:id`), el simulador DEBERÁ reiniciarse con los valores por defecto: 10 usuarios, `storage` 0 y `apiCalls` 0, sin errores ni presupuesto guardado a la vista. La divisa activa NO se reinicia, porque es del header.

### Header, tema y modo presentación
- RF28: El header DEBERÁ mostrar logo (enlace a `/`), buscador, selector de divisa (EUR, USD y GBP) con el pie "Tipos actualizados: hh:mm" (V5, con la hora más antigua de los tipos recibidos; sin pie si no hay tipos) e interruptor de tema. El selector solo ofrece esas tres divisas (U2).
- RF29: CUANDO el usuario cambia de tema, el sistema DEBERÁ aplicarlo en `<html data-theme>` y guardarlo en `localStorage` (`som-theme`). SI no hay preferencia guardada, ENTONCES DEBERÁ usar siempre el oscuro, sin mirar `prefers-color-scheme`. SI el valor guardado no es `light` ni `dark`, ENTONCES DEBERÁ usar el oscuro.
- RF30: CUANDO el usuario pulsa la tecla `P` o el botón de presentación en el detalle de un cliente, el sistema DEBERÁ ocultar el header y las listas y dejar solo el simulador a pantalla completa, **manteniendo visible el selector de divisa**. Pulsar `P` o `Esc` DEBERÁ salir. La tecla `P` NO DEBERÁ activarse cuando se pulsa con Ctrl, Alt, Meta o Mayús, ni cuando el foco está en un `input`, `select`, `textarea` o slider. En pantallas sin simulador (lista y alta) no hace nada.

### Presentación de datos
- RF39: La interfaz DEBERÁ dar formato a los importes con `Intl.NumberFormat` en `es-ES` (separador de miles y coma decimal) y mostrar siempre el código de la divisa (`EUR`, `USD` o `GBP`) junto a cada importe, con `tabular-nums`. Un importe de 0 DEBERÁ mostrarse como "0,00", nunca "-0,00". Las fechas DEBERÁN mostrarse en la hora local del navegador (V8).
- RF40: El subtítulo del gráfico DEBERÁ calcular el porcentaje sobre la base sin IVA, redondeado half-up a entero, e indicar el tramo con más peso (en empate, el de número menor): "Coste mensual: 140,00 EUR · el 71 % sale del tramo 1". CUANDO los usuarios son 0, el gráfico NO DEBERÁ mostrar porcentaje; mostrará "Sin usuarios: no hay coste que desglosar".

### Calidad, accesibilidad y diseño (transversales)
- RF31: La interfaz DEBERÁ usar solo los tokens de `DESIGN.md` (sin colores escritos a mano), contraste AA en ambos temas, anillo de foco de 2 px con 2 px de offset, áreas táctiles de 44 px como mínimo, `tabular-nums` en todos los importes y respetar `prefers-reduced-motion`. Contraste, 44 px y diseño se verifican a mano en el navegador (CA7), no en jsdom.
- RF32: La interfaz DEBERÁ funcionar sin scroll horizontal desde 360 px, con la rejilla de tarjetas de 1, 2 y 3 columnas en `sm` (640) y `md` (1024), y ancho máximo de contenido de 1200 px.
- RF33: Todos los controles DEBERÁN tener nombre accesible (etiqueta o `aria-label`), los errores de campo DEBERÁN asociarse a su campo (`aria-describedby`) y los cambios de estado (carga, error, guardado) DEBERÁN anunciarse en una región `aria-live="polite"` con la espera de V7.
- RF34: Todo texto de error mostrado DEBERÁ ser el `message` del backend o un texto propio en español, y NUNCA una traza, una URL interna ni JSON en bruto. SI una respuesta no tiene la forma `{ error: { code, message, details? } }` o falla su validación, ENTONCES la interfaz DEBERÁ mostrar el error general de RF14 y no romper.
- RF35: La interfaz DEBERÁ importar de `shared/` el cálculo de tramos, IVA y conversión, la forma de `Customer`, la lista de países y los planes, y NO DEBERÁ duplicar tablas de precios, de IVA ni validadores de identificador fiscal.

### Corrección de `DESIGN.md`
- RF36: El selector de divisa de `DESIGN.md` DEBERÁ pasar a "EUR, USD y GBP" (sin CHF ni JPY). Se aplica antes de implementar.

## Casos límite (entrada → salida esperada)
Salvo que se diga otra cosa: cliente 7 con país `ES`, cliente 8 con `US` (IVA 0 %), cliente 9 con `PT` (23 %) y cliente 999 inexistente. Tipos ilustrativos: 1 EUR = 1,10 USD y 0,85 GBP.

### Tramos e IVA en la vista previa (EUR, cliente `ES`)
| Usuarios | Base / IVA / Total | Comprobación |
|---|---|---|
| 0 | 0,00 / 0,00 / 0,00 | La barra no tiene segmentos con ancho; la tabla muestra los tres tramos con 0 unidades; el total es "0,00 EUR" (nunca "-0,00"); sin porcentaje en el subtítulo |
| 1 | 10,00 / 2,10 / 12,10 | Solo tramo 1 |
| 10 | 100,00 / 21,00 / 121,00 | Límite del tramo 1 |
| 11 | 108,00 / 22,68 / 130,68 | Entra el tramo 2 con 1 unidad; su segmento es estrecho y su etiqueta va fuera |
| 50 | 420,00 / 88,20 / 508,20 | Límite del tramo 2 |
| 51 | 425,00 / 89,25 / 514,25 | Entra el tramo 3 con 1 unidad |
| 15, cliente `US` | 140,00 / 0,00 / 140,00 | IVA 0 %: la fila de IVA sigue visible con 0,00; subtítulo "el 71 % sale del tramo 1" |
| 100 000 | 500 170,00 / 105 035,70 / 605 205,70 | El total cabe y no se corta en 360 px |
| 100 000, cliente `PT` | 500 170,00 / 115 039,10 / 615 209,10 | Importe máximo |

La vista previa coincide siempre con la respuesta del backend para el mismo cliente y usuarios en EUR (test de coherencia).

### Control de usuarios y campo numérico
| Entrada | Salida |
|---|---|
| Slider en 0, tecla Inicio | 0 usuarios, campo "0", total 0,00 |
| Slider en 100, tecla Fin | 100 usuarios, campo "100" |
| Flecha derecha en 10 | 11 usuarios (cambia de tramo en la barra) |
| Campo `100`, `101`, `5000`, `100000` | Válidos; con más de 100 el slider queda en 100 y el campo y el total siguen con el valor escrito |
| Campo `100001`, `99999999999999999999` | Error; se mantiene el último valor válido; "Guardar" deshabilitado |
| Campo `-1`, `+5`, `1.5`, `1,5`, `1e3`, `abc`, `1 0`, `٣`, vacío | Error; se mantiene el último valor válido; "Guardar" deshabilitado |
| Campo `  25  ` (espacios en los extremos) | 25 usuarios |
| Campo `0010` | 10 usuarios |
| Último valor válido 51, el usuario escribe `5x` | Error; el total sigue siendo el de 51 usuarios; al corregir a `52` se recalcula |
| `storage` o `apiCalls` con `-1`, `1000001`, `1.5` | Error de campo; no se envía |

### Divisa activa y vista previa convertida (15 usuarios, `ES`: base 140,00, IVA 29,40, total 169,40)
| Divisa activa / situación | Salida |
|---|---|
| EUR | Sin vista previa convertida |
| USD, tipo 1,10 | Vista previa 154,00 + 32,34 = 186,34 USD, con "Vista previa" y el tipo |
| GBP, tipo 0,85 | Vista previa 119,00 + 24,99 = 143,99 GBP |
| 51 usuarios en USD | IVA convertido 98,18 (9 817,5 céntimos → 9 818, half-up) y total 565,68 |
| `GET /exchange-rates` devuelve 500 al arrancar | USD y GBP deshabilitadas, EUR activa, badge `--warning` con "Reintentar"; no hay reintentos automáticos; el simulador sigue usable en EUR |
| "Reintentar" y la API responde | USD y GBP habilitadas; la divisa activa sigue en EUR |
| Tipos con `exchangeRateAt` distintos (09:00 y 09:20) | Pie "Tipos actualizados: 09:00" (la más antigua) |
| Selector con CHF, JPY u otra divisa | No existen en el selector (U2) |
| Backend responde `CURRENCY_NOT_AVAILABLE` (caso forzado por un cliente HTTP) | Error del control de divisa con la `suggestion` "EUR, USD, GBP" |
| Divisa activa USD y se guarda; luego se cambia a GBP | La simulación guardada sigue mostrándose en USD |
| Cambiar de USD a EUR y pulsar "Guardar" | Se envía `currency` `EUR` |

### Alta de cliente
| Entrada | Salida |
|---|---|
| Formulario vacío | Se envían cuatro campos de texto como `""`; los errores del backend aparecen cada uno en su control; el foco va al primero |
| País `ES`, NIF con letra de control incorrecta | `TAX_ID_INVALID_CHECKSUM` junto a "Identificador fiscal" |
| País `ES`, DNI con letra correcta, NIE con letra correcta, CIF con control correcto | 201; se navega al detalle |
| País `GB` con `GB980780684` | `TAX_ID_INVALID_FORMAT` con `reason` `COUNTRY_PREFIX`; mensaje en español del mapa |
| `reason` que no está en el mapa | Se muestra el `message` del backend |
| País `UK` | `INVALID_COUNTRY` con la sugerencia "¿Querías decir GB?" |
| Email no válido y tax ID no válido a la vez | Dos errores, cada uno en su control, en el orden de la respuesta |
| Mismo país y tax ID que uno existente (también con puntos o espacios distintos) | 409; mensaje y enlace al cliente existente |
| 400 `UNKNOWN_FIELD`, `MALFORMED_JSON` o un `field` que no está en la tabla | Aviso general del formulario; no se pierde lo escrito |
| Doble clic en "Crear cliente" | Una sola petición |
| Backend caído | Error general con "Reintentar"; lo escrito se conserva |

### Lista y búsqueda
| Entrada | Salida |
|---|---|
| Base sin clientes | Vacío con "Dar de alta un cliente" |
| `q=acme` con "Acme Ibérica SL" | Lo muestra; la URL es `/?q=acme` |
| Recargar `/?q=acme` | La búsqueda y el resultado se conservan |
| `q=iberica` | Sin resultados (la búsqueda no ignora tildes, D11); mensaje "Sin resultados para «iberica»" |
| `q=` con solo espacios | Lista completa |
| Texto de más de 100 caracteres | El campo no admite más de 100 |
| Escribir "a", "ac", "acm" en menos de 300 ms | Una sola petición con `q=acm`; una respuesta tardía de "a" no reemplaza a la última |
| `q=%` o `q=_` | Se envían codificados; resultado literal |
| Más de 50 coincidencias | 50 tarjetas y "Mostrando 50 de TOTAL" |
| Cliente con 0, 1 y 2 simulaciones | "0 simulaciones", "1 simulación", "2 simulaciones" |
| Orden | Colación española, desempate por id |

### Detalle y simulaciones guardadas
| Entrada | Salida |
|---|---|
| `/customers/7` | Datos del cliente y su lista de simulaciones, `createdAt` DESC, `id` DESC |
| `/customers/999`, `/customers/abc`, `/customers/0` | "Cliente no encontrado" (404 o `INVALID_ID`) |
| Cliente sin simulaciones | Vacío con "Crear la primera simulación" |
| Simulación guardada en USD con tipo 1,10 y tipo actual 1,20 | Se muestra con 1,10 y sus importes guardados (congelación) |
| Simulación migrada de la 003 | Se muestra como EUR con tipo 1,000000 |
| Cliente con `simulationCount` 3 y la lista devuelve 3 | Coinciden en la pantalla |
| Cambiar del cliente 7 al 9 tras mover el slider | El simulador del 9 vuelve a 10 usuarios, `storage` 0, `apiCalls` 0 |
| Fecha `2026-11-13T09:30:00.000Z` | Se muestra en hora local del navegador |

### Guardar simulación
| Entrada | Salida |
|---|---|
| 15 usuarios, EUR | 201; importes del backend iguales a la vista previa |
| 15 usuarios, USD, tipo del backend 1,12 y vista previa con 1,10 | 201; se muestran los importes del backend y el aviso de tipo distinto |
| Backend 404 `CUSTOMER_NOT_FOUND` | "Cliente no encontrado" |
| Backend 500 `EXCHANGE_RATE_UNAVAILABLE` | Explicación, "Reintentar" y "Guardar en EUR"; nada guardado ni contado |
| Doble clic en "Guardar" | Una sola petición |
| Tras guardar | La simulación aparece arriba de la lista y `simulationCount` sube en 1 sin recargar (consultas del cliente, de sus simulaciones y de la lista invalidadas) |

### Contador en el backend
| Caso | Salida |
|---|---|
| Cliente recién creado | `simulationCount` 0 |
| Dos altas de simulación y una rechazada | `simulationCount` 2 |
| `GET /customers` con clientes de 0, 1 y 3 simulaciones | Cada uno con su valor; orden y `total` sin cambios |
| `GET /customers?q=...` | Mismo contador que en el detalle |
| `POST /customers` con `simulationCount` en el cuerpo | 400 `UNKNOWN_FIELD` |

### Tema, presentación y teclado
| Caso | Salida |
|---|---|
| Primera visita, sin `som-theme`, sistema en claro | Oscuro |
| `som-theme` = `light` / `dark` / `foo` | Claro / oscuro / oscuro |
| `P` con el foco en el buscador, el campo de usuarios, un `select`, un `textarea` o el slider | No activa presentación |
| `Ctrl+P`, `Alt+P`, `Meta+P` o `Mayús+P` | No activa presentación (Ctrl+P conserva la impresión del navegador) |
| `P` en el detalle fuera de un campo | Presentación: sin header ni listas, con el selector de divisa visible; otra `P` o `Esc` sale |
| `P` en la lista | Sin efecto |
| Comunicación | Las peticiones van a `/api/...` y se reenvían al backend sin el prefijo |

### Casos límite obligatorios de SaaS-O-Matic
- Límites de tramo 0, 1, 10, 11, 50 y 51: ver "Tramos e IVA".
- Letras de control de DNI, NIE y CIF: la interfaz no las valida, solo muestra el resultado del backend (ver "Alta de cliente").
- Divisa no disponible: ver "Divisa activa y vista previa convertida".
- Redondeo del IVA: ver 51 usuarios en USD y la fila de 11 usuarios (22,68 EUR).

## Criterios de aceptación
- CA1: Cada fila de las tablas de casos límite que se pueda comprobar sin navegador tiene un test automatizado (Vitest con jsdom y un cliente HTTP simulado) que la reproduce y pasa. Ningún test llama a una API real.
- CA2: Un test comprueba que, para los usuarios 0, 1, 10, 11, 50 y 51 y los países `ES`, `PT` y `US`, la vista previa de la interfaz es idéntica a `calculateQuote` y a la respuesta del backend.
- CA3: Un test comprueba que `POST /simulations` desde la interfaz contiene solo `customerId`, `users`, `storage`, `apiCalls` y `currency`, y que `currency` es la activa al pulsar "Guardar".
- CA4: Los tests del backend para RF1 a RF3 pasan, y los tests de las specs 001 y 003 se ajustan solo en el campo `simulationCount` y siguen pasando.
- CA5: Toda pantalla tiene un test de sus estados de carga, error y vacío.
- CA6: Un test comprueba que no hay colores escritos a mano en `frontend/` (solo `var(--token)`), y `DESIGN.md` solo lista EUR, USD y GBP.
- CA7: Se verifican a mano en el navegador, y se deja constancia en la revisión: contraste AA en ambos temas, áreas táctiles de 44 px, ausencia de scroll horizontal a 360 px, rejilla de 1, 2 y 3 columnas, etiquetas del gráfico fuera de los segmentos estrechos y `prefers-reduced-motion`. No se prueban en jsdom.
- CA8: `npm test` y `npm run lint` terminan sin errores, incluyendo el paquete `frontend`, y `npm run dev` levanta backend y frontend con las llamadas `/api` reenviadas.
- CA9: Comprobable antes de implementar: `DESIGN.md` corregido (RF36), y `MEMORY.md` con D16 y el estado de la 005 en `spec aprobada`.

## Supuestos y dependencias
- DEP1: Depende de la 001 a la 004 (API, errores de campo, forma de la simulación, tipos de cambio) y de `shared/`.
- DEP2: Las dependencias nuevas del frontend (React, Vite, TanStack Query, un enrutador, Testing Library y jsdom) se justifican en el plan (CLAUDE.md).
- S1: Un único usuario por sesión y sin autenticación (la 001 a la 004 no la tienen).
- S2: Los tipos son un valor de referencia, no una cotización (S2 de la 004).
- S3: El contrato JSON es el de las specs previas; la 005 solo añade `simulationCount`.

## Fuera de alcance
- Edición y borrado de clientes y simulaciones; listado global de simulaciones y paginación.
- Autenticación, roles y multiusuario.
- i18n, otros idiomas y divisas distintas de EUR, USD y GBP.
- Pantalla de KPI global (la tarjeta de KPI de `DESIGN.md` no se usa en esta spec), gráficos de tendencia y exportación (PDF o CSV).
- Cálculo del precio en otra divisa o conversión con valor en la interfaz.
- CORS en el backend, despliegue de producción del frontend y reintentos automáticos de tipos de cambio.
- Datos de ejemplo y README → spec 006.
- Persistencia de la divisa activa entre sesiones.

## Trazabilidad
Al aprobar, el coordinador debe: (1) corregir el selector de divisa de `DESIGN.md` (RF36); (2) anotar en las specs 001 y 003 la enmienda de contratos con `simulationCount` (RF1 a RF3); (3) registrar en `MEMORY.md` la decisión D16 (U1 a U7 y V1 a V8) y el estado de la 005 en `spec aprobada`.

## Preguntas abiertas
Ninguna. Los valores V1 a V8 son por defecto del planner y se confirman o cambian al aprobar.
