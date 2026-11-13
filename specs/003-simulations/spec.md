# 003 · Simulaciones de suscripción guardadas por cliente
Estado: aprobada

> **Implementación:** todos los importes se calculan, guardan y devuelven como enteros en céntimos (D2). La spec los redacta en euros, igual que la 002 (U9 de la 002). Los importes convertidos de la 004 son céntimos de la divisa de la simulación.
>
> **Enmendada por la 004:** divisa, tipo de cambio congelado e importes convertidos se incorporan al contrato de la simulación (ver `specs/004-currency/spec.md`).

## Contexto y objetivo (por qué)
El equipo comercial necesita simular la suscripción de un cliente ya registrado (001) y conservar ese presupuesto para consultarlo después. Hoy existe la regla de precio pura (002), pero no hay forma de guardarla ni de exponerla por HTTP.

Esta spec añade el borde HTTP de las simulaciones. Valida estrictamente las entradas, rechaza campos desconocidos (D13: "Zod los rechaza en la 003"), recalcula siempre el precio con la regla compartida (constitución, principio 3) y guarda el resultado congelado, para que un presupuesto ya entregado no cambie aunque cambien los tramos o el IVA.

Según D4, el almacenamiento y las llamadas a la API se guardan pero no suman al precio. El plan del cliente tampoco influye (D9).

## Decisiones del usuario (12 nov 2026)
- U1 · Persistencia ligada al cliente: toda simulación se guarda y pertenece a un cliente existente, identificado por `customerId`. El país del IVA es el del cliente guardado, nunca uno que llegue en la petición. Si el cliente no existe, la respuesta es 404. *Descartado:* simulaciones sin cliente con el país en el cuerpo, y calcular sin guardar.
- U2 · Precio congelado: al crear la simulación se guardan el desglose de tramos, la base, el país y el tipo de IVA aplicados, el IVA y el total, y (004) la divisa, el tipo, su fecha y los importes convertidos. Las lecturas devuelven esos valores tal cual, sin recalcular. *Descartado:* guardar solo las entradas y recalcular el precio en cada lectura.
- U3 · `storage` (GB) y `apiCalls` (llamadas al mes): son opcionales, valen 0 si faltan y deben ser enteros de 0 a 1 000 000. Se guardan y se devuelven, pero no afectan al precio (D4). *Descartado:* hacerlos obligatorios o guardar `null` cuando faltan.
- U4 · Endpoints: `POST /simulations`, `GET /simulations/:id` y `GET /customers/:id/simulations`. El listado va de la más reciente a la más antigua, con desempate por id descendente, y no tiene paginación. *Descartado:* un listado global con filtros, y la paginación.
- U5 · Inmutabilidad: las simulaciones no se editan ni se borran, y un cliente que tenga simulaciones no se puede borrar. *Descartado:* borrado físico y borrado lógico.
- U6 · Validación en el borde sin conversiones: un `users` que llegue como texto (`"15"`) es `INVALID_TYPE`, sin convertirlo a número. Los errores del dominio de `users` reutilizan los códigos de la 002 (RF6 y RF7 de la 002).

## Glosario
- **Simulación:** registro inmutable con las entradas (`customerId`, `users`, `storage`, `apiCalls` y `currency`), el presupuesto congelado de la 002 (desglose, base, país, tipo de IVA, IVA y total, en céntimos de euro), la conversión congelada de la 004 (`currency`, `exchangeRate`, `exchangeRateAt` y los tres importes convertidos), un `id` y la fecha de creación `createdAt` (ISO 8601 en UTC).
- **Presupuesto congelado:** la salida de la regla de presupuesto de la 002 en el momento de crear la simulación.
- **Campo desconocido:** cualquier propiedad del cuerpo distinta de `customerId`, `users`, `storage`, `apiCalls` y `currency`. Por ejemplo, `exchangeRate`, `convertedTotalCents`, `country`, `plan`, `totalCents`, `baseCents`, `vatCents`, `tiers`, `id` o `createdAt`.
- **`createdAt`:** instante de creación en ISO 8601 UTC con milisegundos, exactamente en el formato de `Date.prototype.toISOString()` (`YYYY-MM-DDTHH:mm:ss.sssZ`, por ejemplo `2026-11-12T10:00:00.000Z`).
- **Claves duplicadas en el JSON:** se aplica el mismo criterio que en la 001: si una clave aparece varias veces, gana la última (comportamiento estándar del parseo JSON) y no hay error por duplicado.

## Requisitos funcionales (EARS)

### Crear simulación
- RF1 · Alta: CUANDO llega un `POST /simulations` válido para un cliente existente, el sistema DEBERÁ calcular el presupuesto con la regla de la 002, usando `users` y el país guardado del cliente, calcular también la conversión (RF1 y RF5 de la 004), guardar la simulación y responder 201 con la simulación completa (ver "Forma de la simulación").
- RF2 · Recálculo obligatorio: el sistema DEBERÁ obtener todos los importes de la regla compartida de la 002 y nunca del cuerpo de la petición. Un cuerpo que traiga importes, el país o el desglose se rechaza por RF5.
- RF3 · Sin factores ajenos: CUANDO se crea una simulación, el precio DEBERÁ depender solo de `users` y del país del cliente. `storage`, `apiCalls` y el plan del cliente no lo cambian (D4, D9).
- RF4 · Valores por defecto: CUANDO falta `storage` o `apiCalls`, el sistema DEBERÁ guardarlo y devolverlo como 0.

### Validación del cuerpo (400 `VALIDATION_ERROR`)
Los errores usan el formato de la 001: `{ error: { code: "VALIDATION_ERROR", message, details: { fields: [ { field, code, message, reason?, suggestion? } ] } } }`. Hay como máximo un error por campo, en el orden `customerId`, `users`, `storage`, `apiCalls`, `currency` (RF13 de la 004) y, al final, los campos desconocidos.
- RF5 · Campos desconocidos: SI el cuerpo trae algún campo desconocido, ENTONCES el sistema DEBERÁ responder 400 con un error `UNKNOWN_FIELD` por cada campo desconocido, con `field` igual al nombre del campo, y sin guardar nada. Si hay varios, van en el orden en que aparecen en el cuerpo, como en la 001.
- RF6 · `customerId`: SI falta o vale `null`, ENTONCES el sistema DEBERÁ devolver `REQUIRED`. SI no es de tipo número, ENTONCES DEBERÁ devolver `INVALID_TYPE`. SI es un número pero no es un entero seguro ≥ 1, ENTONCES DEBERÁ devolver `INVALID_ID`. `-0` no es ≥ 1, así que da `INVALID_ID`.
- RF7 · `users`: SI falta o vale `null`, ENTONCES el sistema DEBERÁ devolver `REQUIRED`. SI no es de tipo número (texto incluido), ENTONCES DEBERÁ devolver `INVALID_TYPE`. SI es un número fuera de dominio, ENTONCES DEBERÁ devolver `INVALID_USERS` con el `reason` de la 002 (`NOT_INTEGER`, `NEGATIVE` o `TOO_LARGE`). `NOT_FINITE` no se puede dar por HTTP, porque JSON no representa `NaN` ni `Infinity`.
- RF8 · `storage` y `apiCalls`: SI están presentes y valen `null` o no son de tipo número, ENTONCES el sistema DEBERÁ devolver `INVALID_TYPE`. SI son un número no entero, menor que 0 o mayor que 1 000 000, ENTONCES DEBERÁ devolver `INVALID_RESOURCE` con `reason` igual a `NOT_INTEGER`, `NEGATIVE` o `TOO_LARGE`, en ese orden de prioridad. `-0` es válido y se guarda y devuelve como +0.
- RF9 · Cuerpo no válido: SI el cuerpo no es JSON, no es un objeto, no llega como `application/json` o supera el tamaño máximo, ENTONCES el sistema DEBERÁ responder con los mismos errores de borde que la 001 (`MALFORMED_JSON`, `INVALID_TYPE` en `body`, `UNSUPPORTED_CONTENT_TYPE` o `PAYLOAD_TOO_LARGE`).
- RF10 · Orden de comprobación: CUANDO el cuerpo tiene errores de validación, el sistema DEBERÁ responder 400 sin consultar si existe el cliente. La comprobación de existencia (RF11) solo se hace con un cuerpo válido.

### Cliente
- RF11 · Cliente inexistente: SI `customerId` es válido pero no corresponde a ningún cliente, ENTONCES el sistema DEBERÁ responder 404 `CUSTOMER_NOT_FOUND`, sin guardar nada.
- RF12 · País del cliente: CUANDO se calcula el presupuesto, el sistema DEBERÁ usar el país guardado del cliente, que ya es válido y normalizado (001). SI la regla de la 002 devolviera aun así un error por el país, ENTONCES el sistema DEBERÁ responder 500 `INTERNAL_ERROR` con el mensaje genérico, sin `details` y sin guardar nada, comprobándolo antes de pedir el tipo de cambio (RF14 de la 004), y DEBERÁ registrar el error en el log del servidor (salida de error), igual que cualquier error inesperado de la 001 (RF31 de la 001). El log nunca llega a la respuesta.
- RF13 · Cliente con simulaciones: MIENTRAS un cliente tenga al menos una simulación, el sistema DEBERÁ impedir que se borre. Se garantiza con integridad referencial en el almacenamiento, porque la API todavía no ofrece borrar clientes:
  - la conexión a la base de datos DEBERÁ activar la comprobación de claves foráneas (`PRAGMA foreign_keys = ON`) en todos los modos (archivo y memoria, desarrollo y tests); hoy no se activa;
  - la referencia de la simulación al cliente DEBERÁ ser una clave foránea con `ON DELETE RESTRICT`;
  - la tabla de clientes existente y sus datos DEBERÁN mantenerse sin cambios; la tabla de simulaciones se crea con su clave foránea sobre una base que ya tenga clientes, y en las bases creadas con la 003 se amplía con la migración idempotente de RF20 de la 004, manteniendo la FK `ON DELETE RESTRICT`.

### Consultas
- RF14 · Detalle: CUANDO llega un `GET /simulations/:id` con un id existente, el sistema DEBERÁ responder 200 con la simulación guardada, idéntica a la que devolvió el alta, sin recalcular el precio ni reconvertir (U2, RF19 de la 004).
- RF15 · Simulación inexistente: SI el `:id` es válido pero no existe, ENTONCES el sistema DEBERÁ responder 404 `SIMULATION_NOT_FOUND`. SI el `:id` no es un entero decimal canónico de 1 a `MAX_SAFE_INTEGER`, ENTONCES DEBERÁ responder 400 `VALIDATION_ERROR` con `INVALID_ID` en `id`, con el mismo criterio que `GET /customers/:id` de la 001.
- RF16 · Listado por cliente: CUANDO llega un `GET /customers/:id/simulations` de un cliente existente, el sistema DEBERÁ responder 200 con `{ items: [...] }`, que contiene todas sus simulaciones de la más reciente a la más antigua por `createdAt`, con desempate por `id` descendente. SI el cliente no tiene simulaciones, ENTONCES DEBERÁ devolver `items: []`.
- RF17 · Listado de un cliente inexistente: SI el `:id` es válido pero el cliente no existe, ENTONCES el sistema DEBERÁ responder 404 `CUSTOMER_NOT_FOUND`. Un `:id` no válido sigue la regla de RF15 (400 `INVALID_ID`).
- RF18 · Parámetros de consulta: SI `GET /customers/:id/simulations` o `GET /simulations/:id` reciben parámetros de consulta, ENTONCES el sistema DEBERÁ ignorarlos (no hay filtros ni paginación, U4).

### Inmutabilidad
- RF19 · Sin edición ni borrado: SI llega un método no definido sobre las rutas de simulaciones (`GET /simulations`, `POST /simulations/:id`, `PUT`, `PATCH` o `DELETE` sobre `/simulations` o `/simulations/:id`, o cualquier método distinto de `GET` sobre `/customers/:id/simulations`), ENTONCES el sistema DEBERÁ responder 404 `NOT_FOUND` antes de leer el cuerpo, con el mismo orden de comprobación que la 001 (primero ruta y método), así que un JSON no válido en esas peticiones también da 404 y no 400. La simulación DEBERÁ seguir intacta.
- RF20 · Congelación: CUANDO cambie la definición de tramos o de IVA, el sistema DEBERÁ seguir devolviendo los importes guardados en las simulaciones existentes, incluidos la divisa, el tipo, su fecha y los importes convertidos. Se verifica con un test que guarda una simulación con importes distintos de los actuales y comprueba que la lectura los devuelve sin cambios.

## Forma de la simulación (normativa)
La respuesta de `POST /simulations` (201) y de `GET /simulations/:id` (200), y cada elemento de `items` en el listado, tienen exactamente estos campos y ninguno más (los de esta tabla y los de la ampliación de la 004, RF8). No se incrusta el cliente: solo va `customerId`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | entero ≥ 1 | asignado por el almacenamiento |
| `customerId` | entero ≥ 1 | |
| `users` | entero de 0 a 100 000 | |
| `storage` | entero de 0 a 1 000 000 | GB; 0 si no llegó |
| `apiCalls` | entero de 0 a 1 000 000 | llamadas al mes; 0 si no llegó |
| `tiers` | array de 3 objetos, en orden | cada uno con `tier` (1, 2 o 3), `from` (entero), `to` (entero, o `null` en el tramo 3), `unitPriceCents`, `billedUsers` y `subtotalCents` (enteros) |
| `baseCents` | entero ≥ 0 | |
| `country` | texto ISO alfa-2 | país del cliente en el momento del alta |
| `vatRatePercent` | entero ≥ 0 | |
| `vatCents` | entero ≥ 0 | |
| `totalCents` | entero ≥ 0 | |
| `createdAt` | texto | formato de `toISOString()` (Glosario) |

Ejemplo con el cliente 7 (`ES`), 15 usuarios, 50 GB y 0 llamadas a la API:
```json
{
  "id": 1,
  "customerId": 7,
  "users": 15,
  "storage": 50,
  "apiCalls": 0,
  "tiers": [
    { "tier": 1, "from": 1,  "to": 10,   "unitPriceCents": 1000, "billedUsers": 10, "subtotalCents": 10000 },
    { "tier": 2, "from": 11, "to": 50,   "unitPriceCents": 800,  "billedUsers": 5,  "subtotalCents": 4000 },
    { "tier": 3, "from": 51, "to": null, "unitPriceCents": 500,  "billedUsers": 0,  "subtotalCents": 0 }
  ],
  "baseCents": 14000,
  "country": "ES",
  "vatRatePercent": 21,
  "vatCents": 2940,
  "totalCents": 16940,
  "createdAt": "2026-11-12T10:00:00.000Z"
}
```
Los campos del presupuesto conservan los nombres del contrato de la 002 (U9 de la 002). Los textos de `message` son orientativos; los nombres, los tipos y los códigos son normativos.

## Catálogo de errores
| HTTP | `code` | Código de campo / `reason` | RF | Mensaje (orientativo) |
|---|---|---|---|---|
| 400 | `VALIDATION_ERROR` | `UNKNOWN_FIELD` en el campo ajeno | RF5 | "El campo no está permitido." |
| 400 | `VALIDATION_ERROR` | `REQUIRED` en `customerId` o `users` | RF6, RF7 | "El campo es obligatorio." |
| 400 | `VALIDATION_ERROR` | `INVALID_TYPE` en `customerId`, `users`, `storage` o `apiCalls` | RF6–RF8 | "El campo debe ser un número." |
| 400 | `VALIDATION_ERROR` | `INVALID_ID` en `customerId` (cuerpo) o `id` (ruta) | RF6, RF15, RF17 | "El identificador no es válido." |
| 400 | `VALIDATION_ERROR` | `INVALID_USERS` con `NOT_INTEGER`, `NEGATIVE` o `TOO_LARGE` | RF7 | los de la 002 |
| 400 | `VALIDATION_ERROR` | `INVALID_RESOURCE` en `storage` o `apiCalls`, con `NOT_INTEGER`, `NEGATIVE` o `TOO_LARGE` | RF8 | "Debe ser un entero entre 0 y 1 000 000." |
| 400 | `VALIDATION_ERROR` | `INVALID_TYPE` en `currency`, `INVALID_CURRENCY`, `CURRENCY_NOT_AVAILABLE` | RF13 (004) | los de la 004 |
| 400 | `VALIDATION_ERROR` | `INVALID_TYPE` en `body` | RF9 | "El cuerpo debe ser un objeto JSON." |
| 400 | `UNSUPPORTED_CONTENT_TYPE` | — | RF9 | el de la 001 |
| 400 | `PAYLOAD_TOO_LARGE` | — | RF9 | el de la 001 |
| 400 | `MALFORMED_JSON` | — | RF9 | el de la 001 |
| 404 | `CUSTOMER_NOT_FOUND` | — | RF11, RF17 | "No existe el cliente 999." |
| 404 | `SIMULATION_NOT_FOUND` | — | RF15 | "No existe la simulación 424242." |
| 404 | `NOT_FOUND` | — | RF19 | "La ruta solicitada no existe." |
| 500 | `INTERNAL_ERROR` | — (sin `details`) | RF12 | "Error interno del servidor." |
| 500 | `EXCHANGE_RATE_UNAVAILABLE` | — (sin `details`) | RF16 (004) | el de la 004 |

La 003 no añade ningún 409.

## Casos límite (entrada → salida esperada)
Salvo que se indique otra cosa: el cliente 7 existe con país `ES`, el cliente 8 existe con país `US` y el cliente 999 no existe.

### Alta: tramos e IVA de extremo a extremo
| Cuerpo | Estado | Base / IVA / Total (€) |
|---|---|---|
| `{customerId: 7, users: 0}` | 201 | 0,00 / 0,00 / 0,00; `storage` 0 y `apiCalls` 0 |
| `{customerId: 7, users: 1}` | 201 | 10,00 / 2,10 / 12,10 |
| `{customerId: 7, users: 10}` | 201 | 100,00 / 21,00 / 121,00 |
| `{customerId: 7, users: 11}` | 201 | 108,00 / 22,68 / 130,68 |
| `{customerId: 7, users: 50}` | 201 | 420,00 / 88,20 / 508,20 |
| `{customerId: 7, users: 51}` | 201 | 425,00 / 89,25 / 514,25 |
| `{customerId: 7, users: 100000}` | 201 | 500 170,00 / 105 035,70 / 605 205,70 |
| `{customerId: 8, users: 15}` | 201 | 140,00 / 0,00 / 140,00 (`US`, 0 %) |
| `{customerId: 7, users: 15, storage: 1000000, apiCalls: 1000000}` | 201 | 140,00 / 29,40 / 169,40 (igual que sin recursos, RF3) |
| El mismo cuerpo, con clientes de plan `starter` y `enterprise` en `ES` | 201 | importes idénticos (D9) |

### Alta: validación
| Cuerpo | Estado | Error |
|---|---|---|
| `{customerId: 7, users: 15, totalCents: 1}` | 400 | `UNKNOWN_FIELD` en `totalCents`; no se guarda nada |
| `{customerId: 7, users: 15, country: "FR"}` | 400 | `UNKNOWN_FIELD` en `country` |
| `{customerId: 7, users: 15, plan: "enterprise", tiers: []}` | 400 | `UNKNOWN_FIELD` en `plan` y en `tiers` |
| `{tiers: [], customerId: 7, zeta: 1, users: 15, alfa: 2}` | 400 | `UNKNOWN_FIELD` en `tiers`, `zeta` y `alfa`, en ese orden (el del cuerpo) |
| `{"customerId": 7, "users": 999999, "users": 15}` (clave duplicada) | 201 | se usa `users` 15 (gana la última) |
| `{"customerId": 7, "users": 15, "users": -1}` | 400 | `INVALID_USERS`, `NEGATIVE` (gana la última) |
| `customerId`: `-0` | 400 | `INVALID_ID` en `customerId` |
| `storage`: `-0` | 201 | se guarda y devuelve `storage` 0 (+0) |
| `{users: 15}`, `{customerId: null, users: 15}` | 400 | `REQUIRED` en `customerId` |
| `{customerId: "7", users: 15}` | 400 | `INVALID_TYPE` en `customerId` |
| `{customerId: 0, ...}`, `-1`, `1.5`, `9007199254740992` | 400 | `INVALID_ID` en `customerId` |
| `{customerId: 7}`, `{customerId: 7, users: null}` | 400 | `REQUIRED` en `users` |
| `users`: `"15"`, `""`, `true`, `[15]` | 400 | `INVALID_TYPE` en `users` |
| `users`: `-1` / `1.5` / `100001` | 400 | `INVALID_USERS` con `NEGATIVE` / `NOT_INTEGER` / `TOO_LARGE` |
| `users`: `-1.5` | 400 | `INVALID_USERS`, `NOT_INTEGER` (va antes que `NEGATIVE`) |
| `storage`: `0` / `1000000` | 201 | se aceptan los dos extremos |
| `storage`: `-1` / `1000001` / `2.5` | 400 | `INVALID_RESOURCE` con `NEGATIVE` / `TOO_LARGE` / `NOT_INTEGER` |
| `storage`: `null`, `"50"` | 400 | `INVALID_TYPE` en `storage` |
| `apiCalls`: los mismos casos que `storage` | 400 / 201 | los mismos resultados, en `apiCalls` |
| `{customerId: "x", users: -1, storage: -1, foo: 1}` | 400 | cuatro errores en orden: `customerId`, `users`, `storage` y `foo` |
| `{customerId: 999, users: 15}` | 404 | `CUSTOMER_NOT_FOUND` |
| `{customerId: 999, users: -1}` | 400 | `INVALID_USERS` (se valida antes de comprobar el cliente, RF10) |
| `[]`, `"x"`, `null` como cuerpo | 400 | `INVALID_TYPE` en `body` |
| JSON mal formado / sin `application/json` / cuerpo de más de 10 240 bytes | 400 | `MALFORMED_JSON` / `UNSUPPORTED_CONTENT_TYPE` / `PAYLOAD_TOO_LARGE` |

### Consultas
| Petición | Estado | Salida |
|---|---|---|
| `GET /simulations/1` (existe) | 200 | idéntica a la respuesta del alta |
| `GET /simulations/424242` (no existe) | 404 | `SIMULATION_NOT_FOUND` |
| `GET /simulations/0`, `/-1`, `/abc`, `/01`, `/1.5`, `/9007199254740992` | 400 | `INVALID_ID` en `id` |
| `GET /customers/7/simulations` con 3 simulaciones | 200 | `items` de la más reciente a la más antigua |
| Dos simulaciones con el mismo `createdAt` (ids 4 y 5) | 200 | aparece primero la 5 (desempate por id descendente) |
| `GET /customers/8/simulations` sin simulaciones | 200 | `{ items: [] }` |
| `GET /customers/999/simulations` | 404 | `CUSTOMER_NOT_FOUND` |
| `GET /customers/abc/simulations` | 400 | `INVALID_ID` en `id` |
| `GET /customers/7/simulations?page=2&limit=1` | 200 | el listado completo (RF18) |
| El listado del cliente 7 | 200 | no incluye simulaciones del cliente 8 |

### Inmutabilidad y congelación
| Caso | Salida |
|---|---|
| `PUT`, `PATCH` o `DELETE /simulations/1` | 404 `NOT_FOUND`; después, `GET /simulations/1` no ha cambiado |
| `DELETE /simulations` | 404 `NOT_FOUND` |
| `GET /simulations` (no hay listado global) | 404 `NOT_FOUND` |
| `POST /simulations/1` | 404 `NOT_FOUND` |
| `POST /customers/7/simulations`, `PUT /customers/7/simulations` | 404 `NOT_FOUND` |
| `PUT /simulations/1` con cuerpo `{` (JSON no válido) | 404 `NOT_FOUND`, no 400 (primero ruta y método, RF19) |
| Fila guardada con `baseCents` 99900 (no cuadra con los tramos actuales) | `GET` devuelve 99900 (RF20) |
| Borrar en el almacenamiento un cliente con simulaciones | la operación falla por la FK `ON DELETE RESTRICT` y el cliente y sus simulaciones siguen ahí (RF13) |
| Borrar en el almacenamiento un cliente sin simulaciones | se borra (la FK solo restringe si hay simulaciones) |
| Conexión abierta en cualquier modo (archivo o memoria) | `PRAGMA foreign_keys` devuelve 1 |
| Base existente con clientes de la 001 al arrancar | la tabla de clientes y sus filas no cambian; la tabla de simulaciones se crea con su FK hacia clientes |
| Insertar en el almacenamiento una simulación con `customerId` inexistente | la operación falla por la FK |

### Error inesperado (RF12)
| Caso | Salida |
|---|---|
| Cliente insertado directamente en el almacenamiento con país `XX`; `POST /simulations` con su id y `users` 15 | 500 `INTERNAL_ERROR` con el mensaje genérico y sin `details`; 0 simulaciones nuevas; el error queda en el log del servidor |

### Redondeo del IVA
Como en la 002, el redondeo nunca se dispara con los precios actuales. Esta spec no redondea: copia los importes de la regla compartida. Las filas de 11 y 51 usuarios (22,68 € y 89,25 €) comprueban que el IVA guardado coincide exacto al céntimo.

### Casos límite obligatorios que no aplican aquí
- Letras de control de DNI, NIE y CIF: no aplican; el cliente ya está validado en la 001.
- Divisas no disponibles: el precio se calcula y guarda en euros; la conversión congelada está en la 004.

## Criterios de aceptación
- CA1: Cada fila de las tablas de casos límite tiene un test HTTP automatizado (contra una base SQLite en memoria) que la reproduce y pasa.
- CA2: En las simulaciones creadas por `POST /simulations`, los importes guardados y devueltos coinciden exactamente con `calculateQuote` de la 002 para los mismos `users` y país, y los importes convertidos coinciden con la función de conversión compartida de la 004 para los mismos importes en euros y el mismo tipo. No aplica a las filas insertadas directamente para el test de congelación (RF20). No hay ningún cálculo de precio duplicado en el backend.
- CA3: Ninguna petición rechazada (400, 404 o 500) deja una simulación guardada. El test cuenta las filas antes y después.
- CA4: Todos los importes son enteros seguros en céntimos, sin −0 (RF15 de la 002).
- CA5: El test de congelación de RF20 y el de integridad referencial de RF13 pasan.
- CA6: Todas las respuestas de error siguen `{ error: { code, message, details? } }` (constitución, principio 8).
- CA7: `npm test` y `npm run lint` terminan sin errores.

## Supuestos y dependencias
- DEP1: La 001 aporta el cliente, el país normalizado, la validación de `:id` y los errores de borde (JSON, Content-Type y tamaño). Se reutilizan sin duplicarlos.
- DEP2: La 002 aporta `calculateQuote`, sus códigos de error y el contrato de los campos del presupuesto.
- S1: `createdAt` lo pone el servidor en UTC. Para que el orden sea determinista, los tests controlan el reloj.
- S2: El `id` de la simulación es un entero creciente asignado por el almacenamiento.

## Fuera de alcance
- Conversión de divisa y divisas no disponibles → spec 004 (ya incorporada al contrato de la simulación).
- Formulario, slider y listado en la interfaz → spec 005.
- Datos de ejemplo (seed) → spec 006.
- Editar, borrar o duplicar simulaciones, y el borrado de clientes por API.
- Listado global de simulaciones, filtros, búsqueda y paginación.
- Precio del almacenamiento y de las llamadas a la API (D4), precios por plan, descuentos y facturación anual.
- Simulaciones sin cliente, o con un país distinto del país del cliente.

## Trazabilidad
Al aprobar esta spec, el coordinador debe actualizar `MEMORY.md`: registrar como D14 las decisiones U1 a U6, los códigos nuevos (`UNKNOWN_FIELD` en simulaciones, `INVALID_RESOURCE` y `SIMULATION_NOT_FOUND`) y la activación de `PRAGMA foreign_keys = ON` con `ON DELETE RESTRICT`; y cambiar el estado de `003-simulations` a `spec aprobada`.

## Preguntas abiertas
Ninguna.

## Enmienda (spec 005)
El `Customer` de `shared/` gana `simulationCount` (simulaciones guardadas del cliente, calculado en cada lectura sin columna nueva). Crear una simulación con éxito lo incrementa; una rechazada no. Ver `specs/005-dashboard-ui/spec.md`, RF1 a RF3.
