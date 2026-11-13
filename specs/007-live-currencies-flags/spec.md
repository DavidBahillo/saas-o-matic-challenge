# 007 · Divisas en vivo, divisa por país y banderas
Estado: implementada (pendiente de validación)

> **Importes:** como en la 002, 004 y 005, la spec habla en unidades naturales; la implementación sigue en céntimos enteros (D2). Los tipos siguen en micro-unidades (004, RF11).

## Contexto y objetivo (por qué)
Hoy el selector de divisa ofrece solo EUR, USD y GBP (U1 de la 004, U2 de la 005) y el equipo comercial presupuesta a clientes de más países. El usuario pide tres mejoras:
1. Un selector con más divisas, con tipos obtenidos de una API pública, y con los importes convertidos al instante al cambiar de divisa.
2. Que al trabajar con un cliente el simulador arranque con la divisa de su país, para presupuestar por tramos en esa moneda sin elegirla a mano.
3. Que las tarjetas de clientes muestren la bandera del país, cargada desde un servicio público y no guardada en el repositorio.

Se mantiene la regla de la 004 y de la constitución (principio 2): el precio se calcula siempre en euros y solo la conversión **al guardar** una simulación tiene valor y se congela con su tipo y fecha. Esta spec distingue:
- **Divisa de visualización:** la activa del selector. Convierte en vivo la vista previa. No vale nada y no se guarda.
- **Divisa del presupuesto:** la que se envía en `POST /simulations`, que es la activa al pulsar "Guardar" (RF25 de la 005). Se congela con su tipo, fecha e importes convertidos y no cambia aunque el tipo se mueva (RF19 de la 004).

## Decisiones del usuario
- U1 · Proveedor: open.er-api.com (sin clave), siempre a través del backend (`GET /exchange-rates`), con caché de 24 h, timeout de 5 s, validación Zod y los errores de la 004. *Descartado:* mantener Frankfurter; llamar desde el navegador.
- U2 · Divisas: lista fija y concreta escrita en `shared/` (RF1), válida para ver y para guardar. *Descartado:* ver todas y guardar solo tres; ampliar el rango del tipo.
- U3 · Divisa por país: al abrir el simulador de un cliente se preselecciona la divisa de su país; se puede cambiar a mano; el IVA no cambia. *Descartado:* selector de país en el simulador; preselección en el alta.
- U4 · Respaldo EUR cuando la divisa del país no está disponible o no hay tipos. Se enmienda RF38 de la 005 (la divisa se reinicia por cliente).
- U5 · Banderas: flagcdn.com, bandera con código ISO visible, `alt` en español y respaldo al código si falla. Se acepta que el CDN vea la IP del navegador. *Descartado:* solo bandera; emoji.
- U6 · "Tiempo real": conversión inmediata al cambiar de divisa con el tipo cacheado (máximo 24 h), sin refresco periódico.
- U7 · Comportamiento tolerante: si la API no trae una divisa o su tipo es inválido o está fuera de rango, solo esa divisa queda no disponible y el resto funciona. Enmienda "sin tipos parciales" (V2 de la 004).

## Propuestas técnicas del planner (a confirmar al aprobar)
- PT1 · Un único *snapshot* por respuesta del proveedor: una petición trae todos los tipos y la caché es una sola, con un solo instante de recepción. *Descartado:* mantener una caché por divisa (una llamada por divisa gasta el límite de uso del proveedor).
- PT2 · El tipo decimal sale del texto crudo del número en el JSON (reviver con `source`, Node ≥ 22, como ya hace el adaptador actual), sin pasar por coma flotante. *Descartado:* `JSON.parse` a `number` y luego `toFixed`.
- PT3 · `exchangeRateAt` es el instante de recepción de la respuesta (reloj del sistema), no `time_last_update_unix` del proveedor. La fecha del proveedor no se guarda ni se expone (sin cambios de esquema). *Descartado:* guardar también la fecha del proveedor.
- PT4 · Una divisa de la lista ausente o inválida en un snapshot vigente no provoca una nueva llamada hasta que el snapshot caduque (protege el límite de uso). *Descartado:* reintentar por divisa.
- PT5 · Tras un fallo de la API, el backend no vuelve a llamar al proveedor durante 60 s (constante con nombre) y responde 500 directamente. *Descartado:* sin enfriamiento, porque "Reintentar" repetido podría agotar el límite del proveedor.
- PT6 · La divisa de una simulación leída se valida en la interfaz con el formato `^[A-Z]{3}$`, no con la lista, para que una divisa ya retirada de la lista no rompa la lectura. *Descartado:* validar con la lista fija.

## Glosario
- **Divisa disponible (en la lista):** la que está en la lista fija de RF1. **Divisa disponible (en el snapshot):** la de la lista que además trae un tipo válido en el snapshot vigente. EUR es siempre disponible y no tiene tipo.
- **Snapshot:** el conjunto de tipos de una respuesta del proveedor, con su instante de recepción.
- **Divisa pedida:** la que pide la operación en curso (el `currency` de `POST /simulations` o la que pide el servicio de tipos), no la de otras divisas del snapshot.
- **Divisa del país:** la divisa de un país ISO 3166-1 alfa-2 según la tabla de RF13. "Sin divisa propia" significa que el país no tiene divisa en la lista y se usa EUR.
- **Visita al simulador:** cada vez que se entra en `/customers/:id`, incluido recargar, volver desde otra ruta o cambiar de cliente.
- **Bandera:** imagen del país servida por el CDN de RF18.

## Requisitos funcionales (EARS)

### Divisas disponibles y proveedor
- RF1: El sistema DEBERÁ definir en `shared/` una lista fija y ordenada de divisas, que es la única fuente de verdad (también de los 2 decimales): EUR, USD, GBP, CHF, SEK, NOK, DKK, PLN, CZK, CAD, AUD, NZD, MXN, BRL, RON, HKD, SGD, CNY, ILS, ZAR, TRY, THB y AED. Todas tienen 2 decimales (ISO 4217) y un tipo frente al EUR entre 0,01 y 100 con holgura (valores orientativos de nov 2026, del orden de 0,85 a 65). Cualquier otra es no disponible (`CURRENCY_NOT_AVAILABLE`, con la lista en `suggestion`). Quedan fuera, por ejemplo, JPY, KRW, ISK (sin decimales), KWD y BHD (3 decimales), y HUF, INR, IDR, CLP y COP (tipo cercano o superior a 100). BGN no figura porque Bulgaria usa el euro desde 2026. El planner de la implementación verifica el rango con los tipos reales antes de cerrar la lista.
- RF2: El sistema DEBERÁ obtener los tipos de open.er-api.com, por defecto `https://open.er-api.com/v6/latest/EUR`, configurable con `EXCHANGE_RATES_URL`, solo desde el backend, que los expone en `GET /exchange-rates`. SI `EXCHANGE_RATES_URL` no es una URL https válida, ENTONCES el backend DEBERÁ negarse a arrancar con un error de configuración, como en la 004. La URL se usa tal cual, sin añadir parámetros: la divisa base va en la propia URL (EUR). El navegador NO DEBERÁ llamar a la API externa.
- RF3: El sistema DEBERÁ validar la respuesta del proveedor con Zod: `result` igual a `"success"`, `base_code` igual a `"EUR"` y `rates` como objeto de números. El tipo de cada divisa DEBERÁ interpretarse a partir del texto crudo del número en el JSON, que DEBERÁ cumplir `^[0-9]+(\.[0-9]+)?$` (una forma con exponente, como `1e0`, o con signo hace inválida esa divisa), y redondearse half-up a 6 decimales sin pasar por coma flotante (RF11 de la 004). Los campos extra (como `time_last_update_unix`) se ignoran.
- RF4: El sistema DEBERÁ guardar una caché única con el último snapshot y su instante de recepción, en memoria (se pierde al reiniciar). El snapshot es vigente con 0 ≤ antigüedad < 24 horas (antigüedad negativa no es vigente). Un snapshot vigente se usa sin llamar al proveedor. `exchangeRateAt` DEBERÁ ser el instante de recepción de la respuesta, igual para todas las divisas del snapshot, y una simulación guarda el par (tipo, instante) de ese snapshot. CUANDO llegan varias peticiones con la caché vacía o caducada, ENTONCES DEBERÁN compartir una única petición en vuelo al proveedor.
- RF5: SI en un snapshot válido falta una divisa de la lista, o su texto no cumple RF3, o su tipo redondeado queda fuera de 0,010000 a 100,000000, ENTONCES el sistema DEBERÁ tratar como no disponible solo esa divisa y mantener las demás. SI la divisa pedida por un `POST /simulations` no es disponible en el snapshot, ENTONCES DEBERÁ responder 500 `EXCHANGE_RATE_UNAVAILABLE` sin guardar nada. No DEBERÁ llamar de nuevo al proveedor hasta que el snapshot caduque (PT4).
- RF6: SI no se puede obtener un snapshot válido (red, timeout de 5 s, estado distinto de 200, forma inválida, `result` distinto de `"success"`, base distinta de EUR, o ninguna divisa válida) y no hay snapshot vigente, ENTONCES el sistema DEBERÁ responder 500 `EXCHANGE_RATE_UNAVAILABLE` (mismo mensaje y sin `details`, RF16 de la 004), no DEBERÁ guardar el dato inválido ni usar uno caducado, y DEBERÁ registrar la causa en el log, nunca en la respuesta.
- RF7: El sistema NO DEBERÁ reintentar por su cuenta ni consultar al proveedor más de una vez por snapshot. SI la última llamada falló, ENTONCES DEBERÁ responder el 500 de RF6 sin llamar al proveedor durante los 60 s siguientes (constante con nombre, PT5).
- RF8: CUANDO llega `GET /exchange-rates`, el sistema DEBERÁ responder 200 con `{ items: [...] }`, con un elemento por cada divisa distinta de EUR disponible en el snapshot, en el orden de la lista, cada uno con `currency`, `exchangeRate` (texto de 6 decimales) y `exchangeRateAt`. Las divisas no disponibles se omiten. SI aplica RF6, ENTONCES DEBERÁ responder 500. Ignora parámetros de consulta y responde 404 `NOT_FOUND` a métodos distintos de `GET` (004, RF18).

### Selector y conversión
- RF9: El selector de divisa del header DEBERÁ listar EUR primero y después las demás en el orden de la lista de `shared/`, con el código y el nombre en español obtenido de `Intl.DisplayNames` (`type: 'currency'`, `es`). Las divisas sin tipo disponible (RF5, o todas si falla RF6) DEBERÁN aparecer deshabilitadas, con el motivo accesible.
- RF10: CUANDO el usuario cambia la divisa activa, el sistema DEBERÁ recalcular la vista previa convertida al instante con la función compartida y el tipo recibido, sin llamar al backend, con la divisa visible junto a cada importe (RF23 y RF39 de la 005). El tipo es el del snapshot (máximo 24 h).
- RF11: SI la divisa activa deja de estar disponible (nuevo `GET /exchange-rates` sin ella, o fallo de tipos), ENTONCES el sistema DEBERÁ volver a EUR sin mostrar error.
- RF12: El sistema DEBERÁ mostrar siempre que muestre tipos de cambio el enlace visible "Tipos de cambio por ExchangeRate-API" a `https://www.exchangerate-api.com`, junto al pie "Tipos actualizados" (también en modo presentación), con `rel="noopener noreferrer"` y nombre accesible. El enlace es atribución exigida por los términos del proveedor.

### Divisa por país
- RF13: El sistema DEBERÁ definir en `shared/` una función pura `país → divisa` **total** sobre los códigos ISO 3166-1 alfa-2 válidos (cualquiera que acepte el alta, D9). La tabla fija enumera al menos: los países que usan el EUR (incluido BG), US y sus territorios con USD, GB → GBP, CH y LI → CHF, y los países de la divisa de la lista (SE, NO, DK, PL, CZ, CA, AU, NZ, MX, BR, RO, HK, SG, CN, IL, ZA, TR, TH, AE). Todo país ISO que no figure en la tabla, o cuya divisa no esté en la lista (como JP), DEBERÁ devolver EUR ("sin divisa propia"). SI el código no es ISO válido, ENTONCES DEBERÁ devolver un error tipado, no EUR (como D5).
- RF14: CUANDO el usuario entra en una visita al simulador, el sistema DEBERÁ aplicar la divisa del país del cliente (RF13) **una sola vez**, cuando estén resueltos a la vez la carga del cliente y la de los tipos (éxito o fallo), y MIENTRAS tanto DEBERÁ mantener el simulador en estado de carga, sin mostrar importes en una divisa provisional (sin parpadeo). SI la divisa del país no es disponible en el snapshot, o los tipos fallaron, ENTONCES DEBERÁ aplicar EUR. El IVA sigue siendo el del país del cliente (S3 de la 004).
- RF15: SI el usuario elige una divisa a mano durante la visita, antes o después de aplicarse la preselección, ENTONCES el sistema NO DEBERÁ sobrescribirla en esa visita, ni siquiera tras "Reintentar" o una recarga de tipos. CUANDO los tipos se recuperan con "Reintentar" y el usuario aún no ha elegido a mano, ENTONCES DEBERÁ aplicar la preselección pendiente. Cada visita nueva (A→B→A, recargar la página, volver desde otra ruta) reinicia la preselección. SI el país del cliente guardado no es un código ISO válido, ENTONCES DEBERÁ usar EUR sin mostrar error. SI la carga del cliente falla (404 o error), NO DEBERÁ cambiar la divisa activa.

### Presupuestos
- RF16: CUANDO el usuario pulsa "Guardar simulación", el sistema DEBERÁ enviar la divisa activa en ese instante (RF25 de la 005); si cambia la divisa mientras la petición está en curso, el presupuesto guardado se muestra en la divisa con la que se envió y la divisa activa no cambia sola.
- RF17: CUANDO se lee una simulación guardada con una divisa que ya no está en la lista, el sistema DEBERÁ devolver y mostrar sus datos congelados con su propio código de divisa, sin error ni reconversión (RF19 de la 004; PT6).

### Banderas
- RF18: CUANDO se muestra el país de un cliente (tarjeta y detalle), el sistema DEBERÁ mostrar su bandera como imagen cargada desde `flagcdn.com`, sin guardar ninguna bandera en el repositorio: `https://flagcdn.com/w20/<código en minúsculas>.png` con `srcset` `https://flagcdn.com/w40/<código>.png 2x`, a 20 × 15 px (reservados desde el inicio), con `loading="lazy"`. La URL base es una constante con nombre.
- RF19: La bandera DEBERÁ llevar `alt` con el nombre del país en español (`Intl.DisplayNames`, tipo `region`), y el código ISO DEBERÁ seguir visible junto a ella. Un lector de pantalla puede leer nombre y código. SI el navegador no conoce el código, ENTONCES el `alt` DEBERÁ ser el propio código.
- RF20: SI la imagen falla (evento `error`: sin red, CDN caído, sin bandera para ese código), ENTONCES el sistema DEBERÁ mostrar solo el código del país, sin icono roto y sin romper la tarjeta (desde 360 px). No hay temporizador de espera: el respaldo se activa únicamente con el evento `error`.
- RF21: La URL DEBERÁ construirse solo con un código de país ya validado por el backend (ISO alfa-2). Un código con formato distinto de `^[A-Z]{2}$` no genera petición y muestra solo el texto.

### Documentación y enmiendas
- RF22: El sistema DEBERÁ dejar actualizada la documentación y anotadas estas enmiendas (cada una con una nota en la spec afectada y en `MEMORY.md`):
  - **Spec 004:** U1 (solo EUR, USD y GBP pasa a la lista de RF1), U2 (el proveedor pasa a open.er-api.com), RF11 (el tipo sale del texto crudo del JSON numérico), RF13 (`suggestion` con la lista ampliada), RF15 (una caché única por snapshot en vez de por divisa), RF16 (500 solo si no hay snapshot o la divisa pedida no es disponible), RF17 (petición en vuelo compartida) y RF18 y V2 (`GET /exchange-rates` sin la regla de "sin tipos parciales").
  - **Spec 005:** U2 y RF36 (selector de tres divisas), RF4 (badge de país pasa a bandera con código), RF23 (vista previa para cualquier divisa distinta de EUR), RF24 (deshabilitado por divisa, y el badge de fallo solo si fallan todos los tipos), RF28 (selector y pie con atribución), RF38 (la divisa activa se reinicia al país por visita), RF39 (códigos de divisa de la lista), y la prueba CA6 ("`DESIGN.md` solo lista EUR, USD y GBP") y la fila "Selector con CHF, JPY u otra divisa".
  - **Documentos:** `DESIGN.md` (selector con la lista, bandera en la tarjeta de cliente y su respaldo, enlace de atribución), `README.md` (lista de divisas, open.er-api.com, `EXCHANGE_RATES_URL` y su nuevo valor por defecto, CDN de banderas y su dependencia de red, límites de uso), `MEMORY.md` (D18 nueva y concisa; D15 y D16 comprimidas para mantener el archivo por debajo de 60 líneas) y el catálogo de errores.
  - **Sin cambios:** la 006 sigue sembrando EUR, USD y GBP con tipos fijos y sin red (U5 de la 006).

## Casos límite (entrada → salida esperada)
Cliente 7 con `ES`, cliente 8 con `US`. Tipos **ilustrativos** (los tests los fijan): 1 EUR = 1,10 USD, 0,85 GBP y 0,95 CHF.

### Tramos e IVA en una divisa ampliada (CHF, tipo 0,95; `ES`, IVA 21 %)
| Usuarios | Base / IVA / Total (EUR) | Base / IVA / Total (CHF) |
|---|---|---|
| 0 | 0,00 / 0,00 / 0,00 | 0,00 / 0,00 / 0,00 (+0, nunca -0) |
| 1 | 10,00 / 2,10 / 12,10 | 9,50 / 2,00 / 11,50 (IVA: 199,5 céntimos, justo a medio, half-up → 200) |
| 10 | 100,00 / 21,00 / 121,00 | 95,00 / 19,95 / 114,95 |
| 11 | 108,00 / 22,68 / 130,68 | 102,60 / 21,55 / 124,15 (2 154,6 → 2 155) |
| 50 | 420,00 / 88,20 / 508,20 | 399,00 / 83,79 / 482,79 |
| 51 | 425,00 / 89,25 / 514,25 | 403,75 / 84,79 / 488,54 (8 478,75 → 8 479) |

El total convertido es siempre base convertida + IVA convertido (RF5 de la 004).

### Lista de divisas y formato de la API
| Entrada | Salida |
|---|---|
| `POST /simulations` con `currency` `CHF` y tipo disponible | 201 con la conversión y el tipo congelados |
| `currency` `JPY`, `KRW`, `HUF`, `KWD`, `BGN` | 400 `CURRENCY_NOT_AVAILABLE` con la lista en `suggestion` |
| `currency` `XXX`, `usd`, `""`, `null` | Igual que la 004 (`CURRENCY_NOT_AVAILABLE`, `INVALID_CURRENCY`, `INVALID_TYPE`) |
| Cada código de la lista | Tiene nombre en español, pertenece a `shared/` y su tipo ilustrativo está entre 0,01 y 100 |
| `EXCHANGE_RATES_URL` = `http://...` o vacío | El backend no arranca (error de configuración) |
| Respuesta `rates.USD` = `1.1` | `"1.100000"` |
| Respuesta `rates.CHF` = `0.951234567` | `"0.951235"` (half-up, sin float) |
| Respuesta `rates.SEK` = `1e1` o como texto `"11"` o `null` | Solo SEK no disponible; el resto sigue |
| Respuesta sin `SEK` | `GET /exchange-rates` sin SEK; `POST` en SEK → 500; CHF sigue en 201 |
| `rates.CZK` = `100.0000005` (redondea a 100,000001) o `0.0099994` | Solo CZK no disponible |
| `rates.CZK` = `100.0000004` o `0.0099996` | Disponible (`"100.000000"` y `"0.010000"`) |
| `result` = `"error"`, `base_code` distinto de `EUR`, sin `rates`, o `rates` sin ninguna divisa válida | 500 `EXCHANGE_RATE_UNAVAILABLE` para todo; nada en caché |
| `GET /exchange-rates` con SEK ausente en un snapshot vigente | Sin SEK; sin llamar de nuevo al proveedor |
| Snapshot de 24 h exactas | Se renueva; con el proveedor caído, 500 sin usar el caducado |
| Cinco peticiones simultáneas con la caché vacía | Una sola llamada al proveedor; todas reciben el mismo par (tipo, instante) |
| Fallo del proveedor y nueva petición a los 30 s | 500 sin llamar al proveedor (enfriamiento de 60 s); a los 61 s vuelve a intentar |
| Respuesta con `time_last_update_unix` | Se ignora; `exchangeRateAt` es el instante de recepción |

### Selector, conversión y atribución
| Entrada | Salida |
|---|---|
| Selector con tipos válidos | EUR primero y el resto en el orden de la lista, con nombre en español |
| Falla un solo tipo | Solo esa opción deshabilitada; no aparece el badge "Tipos de cambio no disponibles" |
| Fallan todos los tipos | Solo EUR habilitada, badge y "Reintentar" (RF24 de la 005) |
| La divisa activa es SEK y el nuevo snapshot ya no la trae | La divisa activa vuelve a EUR sin error |
| Cambio de USD a CHF | Vista previa inmediata, sin petición al backend |
| Pie de tipos | Incluye "Tipos de cambio por ExchangeRate-API" como enlace, también en modo presentación |

### Divisa por país y preselección
| Caso | Salida |
|---|---|
| País `ES`, `PT`, `FR`, `DE`, `IT`, `BG` | EUR |
| `US` | USD |
| `GB` | GBP |
| `CH`, `LI` | CHF |
| `JP` (JPY fuera de la lista), `AR`, `AQ` | EUR (sin divisa propia) |
| Código no ISO (`UK`, `XX`) en la función pura | Error tipado, no EUR |
| Todo código ISO de la lista de `shared/` | La función devuelve una divisa de la lista |
| Abrir cliente `US`, cliente y tipos cargados | Una sola aplicación de USD; mientras tanto, carga sin importes |
| Cliente cargado antes que los tipos | Espera; aplica al resolverse los tipos; sin parpadeo |
| Tipos cargados antes que el cliente | Espera; aplica al cargar el cliente |
| Tipos fallan y el usuario pulsa "Reintentar" con éxito, sin elección manual | Se aplica la divisa del país |
| Igual, pero el usuario eligió GBP a mano | Se conserva GBP |
| El usuario elige divisa antes de que carguen cliente y tipos | Se conserva su elección |
| Cliente `US` (USD) → cliente `ES` | EUR (visita nueva) |
| A (`US`) → B (`ES`) → A | USD al volver a A (visita nueva, aunque antes eligiera otra a mano) |
| Recargar la página en `/customers/7` | Visita nueva: se aplica la divisa del país |
| Volver desde `/` al mismo cliente | Visita nueva |
| País del cliente inválido en la base (`XX` insertado directamente) | EUR, sin error visible |
| Cliente 999 (404) | No cambia la divisa activa |
| Cliente `ES` con USD activa y guardar | `POST` con `currency` `USD`; IVA del 21 % |
| El usuario cambia USD→GBP mientras guarda | Se guardó con USD; el presupuesto se muestra en USD; la activa sigue en GBP |
| Simulación guardada con `currency` `JPY` (insertada directamente, ya fuera de la lista) | Se lee y se muestra con sus datos congelados y el código JPY |

### Banderas
| Caso | Salida |
|---|---|
| Cliente `ES` | `<img src=".../w20/es.png" srcset=".../w40/es.png 2x" alt="España" width=20 height=15 loading="lazy">` y el código `ES` visible |
| Cliente `GB` | `alt="Reino Unido"` |
| Código desconocido para el navegador (`XK`) | `alt` = `XK` |
| Evento `error` de la imagen | Solo el código; sin icono roto |
| Código con formato no válido (`es`, `E1`, vacío) | Sin petición; solo el texto |
| Sin red, la imagen tarda | El hueco de 20 × 15 está reservado; no hay temporizador; el respaldo solo llega con `error` |
| 50 tarjetas | Cada imagen con `loading="lazy"` |
| Lector de pantalla | Puede leer nombre y código |

## Criterios de aceptación
- CA1: Cada fila de las tablas tiene un test automatizado (Vitest, proveedor y reloj simulados, `error` de imagen simulado). Ningún test llama a una API ni a un CDN reales.
- CA2: La lista de divisas y la tabla país→divisa son datos de `shared/` con tests puros: todo código ISO válido da una divisa de la lista (cobertura total, incluidos los de D5), cada entrada explícita de la tabla es ISO válido, y un código no ISO da error.
- CA3: Para cada divisa de la lista, con un tipo ilustrativo dentro del rango, y para los límites 0, 1, 10, 11, 50 y 51: los importes convertidos son enteros seguros ≥ 0, ninguno cumple `Object.is(x, -0)` (con importe 0 el resultado es +0) y `convertedTotalCents === convertedBaseCents + convertedVatCents`. Un test de propiedades comprueba con el tope absoluto de 100 (100 000 000 micro-unidades) y el importe máximo de la 002 que el producto es entero seguro, sin depender del tipo de cada divisa.
- CA4: Los tests de la 004 y la 005 pasan ajustados solo en lo enmendado (RF22).
- CA5: Ninguna simulación se guarda con una divisa no disponible en la lista o en el snapshot; las simulaciones existentes en EUR, USD o GBP, y las de una divisa ya retirada, se leen igual (congelación).
- CA6: **Automático:** toda imagen de bandera tiene `alt` no vacío con el nombre del país (o el código si es desconocido); la URL, `srcset`, tamaño y `loading="lazy"` son los de RF18; el `error` muestra solo el código; el enlace de atribución existe con su texto, `href` y `rel`; el selector usa `Intl.DisplayNames`; `DESIGN.md` y `README.md` listan la lista nueva, el proveedor y el CDN (comprobación de texto); y `MEMORY.md` tiene menos de 60 líneas.
- CA7: **Manual en el navegador (se deja constancia en la revisión):** aspecto de las banderas y el hueco reservado a 360 px y en escritorio, respaldo real sin red, contraste del contorno en ambos temas, selector con lista larga con teclado y lector de pantalla (lectura de nombre y código), y sin parpadeo visible al preseleccionar.
- CA8: `npm test` y `npm run lint` terminan sin errores.

## Supuestos y dependencias
- DEP1: Depende de la 001 (países), 004 (conversión, congelación) y 005 (selector, simulador, tarjetas).
- S1: Los tipos son de referencia, no una cotización (S2 de la 004). open.er-api.com actualiza una vez al día.
- S2: Las banderas son una mejora visual; la aplicación funciona sin ellas.
- S3 (seguridad y operación): pedir banderas a un tercero expone la IP del navegador al CDN; es una herramienta interna y sin cookies ni datos del cliente en la URL (solo el código ISO). Si se añade una Content-Security-Policy (hoy no hay), debe permitir `flagcdn.com`. El proveedor limita las peticiones (consulta gratuita, una actualización diaria, con bloqueo temporal si se abusa) y exige atribución con enlace: por eso hay una única petición por snapshot, la caché de 24 h, la petición compartida y el enfriamiento de 60 s (RF4, RF7, RF12). El planner de la implementación comprueba los términos vigentes del proveedor.
- S4: Un único proceso de backend; la caché no se comparte entre procesos (S4 de la 004).

## Fuera de alcance
- Calcular precios en otra divisa que no sea EUR (sigue siendo conversión posterior).
- Divisas con decimales distintos de 2, tipos fuera de 0,01 a 100 y la lista ISO 4217 completa.
- Refresco periódico o websockets de tipos, histórico de tipos y guardar la fecha del proveedor.
- Guardar banderas en el repositorio, emoji, selector de país en el simulador y cambiar el IVA según la divisa.
- Persistencia de la divisa activa entre sesiones y divisa preferida por cliente.
- Reconversión de simulaciones guardadas.

## Preguntas abiertas
Ninguna. U1 a U7 son del usuario; PT1 a PT6 son propuestas técnicas que se confirman o cambian al aprobar.
