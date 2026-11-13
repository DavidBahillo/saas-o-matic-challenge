# 004 · Divisa de las simulaciones con tipo de cambio congelado
Estado: aprobada

> **Enmienda de la 007 (divisas en vivo):** U1 (solo EUR, USD y GBP) pasa a la lista fija de 23 divisas de la RF1 de la 007; U2 (proveedor) pasa a open.er-api.com; RF11 (el tipo sale del texto crudo del JSON numérico); RF13 (`suggestion` con la lista ampliada); RF15 (una caché única por snapshot, no por divisa); RF16 (500 solo si no hay snapshot o la divisa pedida no está disponible); RF17 (petición en vuelo compartida); RF18 y V2 (`GET /exchange-rates` omite las divisas no disponibles: ya no rige "sin tipos parciales").

> **Implementación:** todos los importes, en euros y convertidos, se calculan, guardan y devuelven como enteros en céntimos (D2). La spec los redacta en la unidad natural (€, USD, GBP), como la 002 y la 003. El tipo de cambio se maneja como entero en micro-unidades (RF11).

## Contexto y objetivo (por qué)
El equipo comercial presupuesta a clientes de varios países y necesita entregar el presupuesto en la divisa del cliente. Hoy el precio (002) y las simulaciones (003) están solo en euros.

Esta spec añade una divisa a la simulación. Al crearla, el sistema convierte el presupuesto con el tipo de cambio vigente y **congela** divisa, tipo y fecha de obtención del tipo, igual que ya congela el precio en euros (D14). Así, un presupuesto entregado en dólares no cambia aunque el tipo de cambio se mueva después.

El precio sigue calculándose siempre en euros con la regla compartida (002). La conversión es una capa posterior que parte de esos importes. El backend nunca acepta importes ni tipos que envíe el cliente (constitución, principio 3).

La interfaz (005) podrá mostrar una **vista previa** convertida mientras el comercial ajusta la simulación. Para ello el backend expone los tipos vigentes (`GET /exchange-rates`) y la interfaz convierte con la misma función de `shared/`. La vista previa no vale nada: lo que vale es lo que se congela al crear la simulación.

## Decisiones del usuario (13 nov 2026)
- U1 · Divisas: EUR, USD y GBP. Cualquier otra es "no disponible". *Descartado:* añadir CHF, MXN o JPY (JPY no tiene decimales) y una lista ISO 4217 completa.
- U2 · Fuente de los tipos: API externa de tipos de cambio con caché. *Descartado:* tabla fija en `shared/`, y tabla fija con sobrescritura por entorno.
- U3 · Congelación: la simulación guarda la divisa, el tipo aplicado y su fecha de obtención. Las lecturas no reconvierten. *Descartado:* convertir al ver con el tipo vigente.
- U4 · Redondeo: se convierten por separado la base y el IVA, con half-up al céntimo; el total convertido es la suma de ambos. Los tramos no se convierten. *Descartado:* redondear cada importe por separado incluido el total, y convertir también los tramos.
- U5 · Divisa como campo de la simulación: `currency` opcional en el alta, EUR por defecto, congelado. Las simulaciones existentes de la 003 se tratan como EUR. *Descartado:* divisa preferida por cliente, y parámetro de consulta sin persistir.
- U6 · Fallo del tipo de cambio: si la API falla y no hay un tipo vigente en caché, la creación falla con 500 `EXCHANGE_RATE_UNAVAILABLE` y no se guarda nada. *Descartado:* usar un tipo caducado, y caer a EUR en silencio.
- U7 · Caché de 24 horas: un tipo en caché es vigente mientras tenga menos de 24 horas; si no hay tipo vigente y la API no responde, 500 `EXCHANGE_RATE_UNAVAILABLE`. *Descartado:* caché de 1 hora, y aceptar tipos caducados hasta 72 horas con aviso.
- U8 · Tipo válido: de 0,01 a 100, ya redondeado a 6 decimales. Fuera de ese rango se trata como fallo de la API (500 `EXCHANGE_RATE_UNAVAILABLE`). *Descartado:* admitir cualquier tipo positivo.
- U9 · Vista previa: se añade `GET /exchange-rates`, con la misma caché y el mismo 500. La interfaz convierte con la función de `shared/` solo para la vista previa. *Descartado:* que el backend ofrezca un endpoint de previsualización que convierta por la interfaz.

## Valores por defecto adoptados (a revisar en la aprobación)
Son decisiones razonables del planner, no del usuario. Si alguna no encaja, se cambia antes de aprobar.
- V1 · Timeout de la API: 5 segundos (constante con nombre).
- V2 · Si en `GET /exchange-rates` falla el tipo de cualquiera de las dos divisas, toda la respuesta es el 500 (no se devuelven tipos parciales).
- V3 · La lista de divisas admitidas va en `suggestion` del error `CURRENCY_NOT_AVAILABLE` (RF13), no en `reason`.
- V4 · Un tipo en caché con antigüedad negativa (el reloj fue hacia atrás) no es vigente.
- V5 · La caché vive en memoria y es por divisa; se pierde al reiniciar.

## Enmiendas necesarias (documentadas, aún sin aplicar)
Esta spec contradice textos vigentes. Al aprobarla, el coordinador debe aplicar estas enmiendas **antes** de implementar (CA8); hasta entonces no se editan.

**Constitución, principio 2.** Texto actual: "El redondeo solo se aplica al IVA (half-up, a céntimo) y la conversión de divisa ocurre únicamente en la capa de presentación."
Texto propuesto: "El precio se calcula siempre en céntimos enteros de euro. El redondeo solo se aplica al IVA y a la conversión de divisa (half-up, al céntimo). La conversión con valor para el cliente se hace una sola vez, al crear la simulación, y su resultado se congela junto con el tipo y su fecha. La interfaz puede convertir con la misma función compartida solo como vista previa, sin valor ni persistencia."

**Spec 003** (los números son los de la 003):
- Glosario, "Campo desconocido": pasa a ser cualquier propiedad distinta de `customerId`, `users`, `storage`, `apiCalls` y `currency`.
- Glosario, "Simulación", y "Forma de la simulación (normativa)": se añaden los campos de esta spec (RF8) y la frase "exactamente estos campos y ninguno más" los incluye.
- RF1: el alta calcula también la conversión (RF1 y RF5 de esta spec).
- RF5: el orden de errores pasa a `customerId`, `users`, `storage`, `apiCalls`, `currency` y, al final, los campos desconocidos.
- RF12: el 500 por país inválido se comprueba antes de pedir el tipo de cambio (RF14 de esta spec).
- RF13: la tabla de simulaciones ya existe en las bases creadas con la 003; el requisito "se crea sobre una base que ya tenga clientes" se amplía con la migración idempotente de RF20 de esta spec, y la FK `ON DELETE RESTRICT` se mantiene.
- RF14: "sin recalcular el precio" pasa a "sin recalcular el precio ni reconvertir" (RF19 de esta spec).
- RF20 y U2: la congelación cubre también divisa, tipo, fecha e importes convertidos.
- Catálogo de errores: se añaden `INVALID_CURRENCY`, `CURRENCY_NOT_AVAILABLE` y `EXCHANGE_RATE_UNAVAILABLE`.
- CA2: los importes convertidos coinciden con la función de conversión compartida de esta spec para los mismos importes en euros y el mismo tipo.
- "Casos límite obligatorios que no aplican aquí" y la frase "Las simulaciones se guardan siempre en euros (céntimos)": se sustituyen por "el precio se calcula y guarda en euros; la conversión congelada está en la 004".
- "Fuera de alcance": la línea "Conversión de divisa y divisas no disponibles → spec 004" pasa a "→ spec 004 (ya incorporada al contrato de la simulación)".
- Cabecera de implementación: "todos los importes... en céntimos enteros" se mantiene; añadir que los convertidos son céntimos de la divisa de la simulación.

**MEMORY.md:** D14 ampliada y nueva D15 (ver "Trazabilidad").

## Glosario
- **Divisa base:** EUR. En ella se calcula y se guarda el precio (D2).
- **Divisa de la simulación:** `EUR`, `USD` o `GBP`.
- **Micro-unidades del tipo:** el tipo de cambio multiplicado por 1 000 000, como entero. 1,10 son 1 100 000 micro-unidades.
- **Tipo de cambio (`exchangeRate`):** unidades de la divisa de la simulación por 1 EUR, con exactamente 6 decimales en texto (RF11). Para EUR vale `"1.000000"`.
- **`exchangeRateAt`:** instante en que el sistema obtuvo el tipo de la API, tomado del reloj del sistema al recibir la respuesta, en el formato de `toISOString()`. No es la fecha que informe la API.
- **Importe convertido:** `round_half_up(importe_en_céntimos_EUR × micro-unidades / 1 000 000)`, en céntimos enteros de la divisa de la simulación.
- **Tipo vigente:** tipo en caché cuya antigüedad `a` cumple 0 ≤ a < 24 horas (RF15).
- **Divisa no disponible:** código que cumple `^[A-Z]{3}$` y no es `EUR`, `USD` ni `GBP`.

## Requisitos funcionales (EARS)

### Alta con divisa
- RF1: CUANDO llega un `POST /simulations` válido con `currency` igual a `USD` o `GBP`, el sistema DEBERÁ calcular el presupuesto en euros con la regla de la 002, convertirlo (RF5 a RF7), guardar la simulación con la divisa, el tipo y su fecha, y responder 201 con la simulación completa.
- RF2: CUANDO falta `currency` o vale `EUR`, el sistema DEBERÁ guardar la simulación con `currency` `EUR`, tipo `"1.000000"` y `exchangeRateAt` igual a `createdAt`, con los importes convertidos iguales a los de euros, sin llamar a la API ni usar la caché, y sin ningún redondeo. Se confirma el valor por defecto EUR (U5).
- RF3: El sistema DEBERÁ obtener todos los importes y el tipo de sus propias reglas y fuentes, nunca del cuerpo. Un cuerpo con `exchangeRate`, `convertedTotalCents` u otro campo de salida se rechaza con `UNKNOWN_FIELD` (RF5 de la 003).
- RF4: El precio en euros DEBERÁ depender solo de `users` y del país del cliente (RF3 de la 003). La divisa nunca cambia `baseCents`, `vatCents`, `totalCents`, `vatRatePercent` ni `tiers`, que siguen en euros.

### Conversión
- RF5: CUANDO se convierte, el sistema DEBERÁ convertir por separado `baseCents` y `vatCents`, cada uno con half-up al céntimo de la divisa destino, y DEBERÁ calcular `convertedTotalCents` como la suma de los dos convertidos, nunca como la conversión de `totalCents`.
- RF6: El sistema DEBERÁ no convertir los tramos: `tiers` se devuelve siempre en céntimos de euro.
- RF7: El IVA convertido DEBERÁ ser la conversión del IVA ya calculado en euros (002), no el tipo de IVA aplicado a la base convertida. El tipo de IVA (`vatRatePercent`) no cambia con la divisa. Por eso `convertedVatCents` puede diferir en 1 céntimo de `convertedBaseCents` × tipo de IVA, y `convertedTotalCents` en 1 céntimo de convertir `totalCents`. Ambos son el comportamiento esperado (casos límite "Redondeo de la conversión").
- RF8: La simulación DEBERÁ incluir, además de los campos de la 003, `currency`, `exchangeRate`, `exchangeRateAt`, `convertedBaseCents`, `convertedVatCents` y `convertedTotalCents` (ver "Forma de la simulación").
- RF9: CUANDO se convierte un importe de 0, el sistema DEBERÁ devolver +0. Toda salida numérica de la conversión cumple `Object.is(valor, -0) === false`.
- RF10: La conversión DEBERÁ ser una función pura y determinista en `shared/` que recibe céntimos enteros y el tipo en micro-unidades, sin red, fecha ni azar (principio 3), y que usa solo aritmética de enteros: el resto se obtiene con el operador de resto de enteros, no con división en coma flotante ni multiplicando por fracciones. La obtención del tipo, la caché y la fecha viven fuera de esa regla.

#### Exactitud con enteros, sin BigInt (RF10)
Con el tipo acotado (U8) y los límites de la 002, el producto cabe en enteros seguros (`Number.MAX_SAFE_INTEGER` = 9 007 199 254 740 991):
- importe en euros máximo: base de 100 000 usuarios = 50 017 000 céntimos; total máximo (`PT`, 23 %) = 61 520 910 céntimos (615 209,10 €);
- tipo máximo: 100 000 000 micro-unidades;
- producto máximo: 61 520 910 × 100 000 000 = 6 152 091 000 000 000 (unos 6,15·10^15), más 500 000 del redondeo, por debajo de 9,007·10^15;
- por tanto la conversión es exacta con `number`. Se convierten la base y el IVA por separado, y cada uno es menor que el total, así que el máximo real es aún menor;
- el resultado máximo es 6 152 091 000 céntimos (≈ 6,15·10^9) y la suma de base y IVA convertidos también es un entero seguro.
Cualquier ampliación de usuarios (002) o del rango del tipo (U8) obliga a repetir esta comprobación.

### Formato del tipo
- RF11: El tipo DEBERÁ guardarse y manejarse como entero en micro-unidades, y devolverse en el JSON como texto con exactamente 6 decimales (`"1.100000"`, `"0.850000"`; EUR es `"1.000000"`). La API devuelve el tipo, y el sistema DEBERÁ interpretarlo a partir de su texto decimal (`^[0-9]+(\.[0-9]+)?$`), sin pasarlo por coma flotante binaria, y redondearlo half-up a 6 decimales. Cualquier otro formato (signo, exponente como `1e0`, `NaN`, vacío, `null`, no numérico) se trata como fallo (RF16).
- RF12: SI el tipo, ya redondeado a 6 decimales, es menor que 0,010000 o mayor que 100,000000 (de 10 000 a 100 000 000 micro-unidades, ambos incluidos), ENTONCES el sistema DEBERÁ tratarlo como fallo (RF16) y no guardarlo en caché.

### Validación de `currency` (400 `VALIDATION_ERROR`)
`currency` se valida en el borde, de forma estricta y sin normalizar.
- RF13: SI `currency` está presente y vale `null` o no es texto, ENTONCES el sistema DEBERÁ devolver `INVALID_TYPE`. SI es texto pero no cumple `^[A-Z]{3}$` (incluidos `""`, minúsculas, espacios, `"US"`, `"USDD"` y un salto de línea final como `"USD\n"`), ENTONCES DEBERÁ devolver `INVALID_CURRENCY`. SI cumple el formato pero no es `EUR`, `USD` ni `GBP`, ENTONCES DEBERÁ devolver `CURRENCY_NOT_AVAILABLE`. Todos son errores de `details.fields[]` con la forma de la 003 (`{ field: "currency", code, message, reason?, suggestion? }`). En `CURRENCY_NOT_AVAILABLE`, `suggestion` es `"EUR, USD, GBP"` (V3) y no se usa `reason`. No se guarda nada ni se usa EUR por defecto.
- RF14: El sistema DEBERÁ procesar el alta en este orden y detenerse en el primer fallo:
  1. validar el cuerpo (400);
  2. comprobar que el cliente existe (404);
  3. calcular el presupuesto en euros con la 002, incluido el 500 `INTERNAL_ERROR` por un país inválido (RF12 de la 003);
  4. solo si la divisa no es EUR, obtener el tipo (RF15 a RF17);
  5. convertir y guardar.
  Así, un fallo del cuerpo, del cliente o del precio nunca llama a la API de tipos de cambio.

### Tipo de cambio: caché, API y fallo
- RF15: El sistema DEBERÁ guardar el último tipo obtenido de cada divisa (USD y GBP, por separado) en una caché en memoria, que se pierde al reiniciar (V5). CUANDO hay un tipo vigente (0 ≤ antigüedad < 24 horas, constante con nombre), DEBERÁ usarlo sin llamar a la API. SI la antigüedad es de 24 horas o más, o es negativa porque el reloj fue hacia atrás (V4), ENTONCES DEBERÁ intentar renovarlo.
- RF16: SI no se puede obtener un tipo (la API falla, supera el timeout de 5 segundos o devuelve un dato inválido: respuesta que no pasa la validación Zod de su forma, formato no decimal, ausencia de la divisa pedida o tipo fuera de rango por RF12) y no hay tipo vigente, ENTONCES el sistema DEBERÁ responder 500 con `EXCHANGE_RATE_UNAVAILABLE` y el mensaje "No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde.", sin `details` y sin guardar nada, y DEBERÁ registrar la causa en el log del servidor, nunca en la respuesta. La respuesta de la API se valida con Zod en el borde. Un dato inválido nunca se guarda en caché y nunca se sustituye por un tipo caducado. Se usa 500 porque la constitución solo admite 400, 404, 409 y 500.
- RF17: `exchangeRateAt` DEBERÁ ser el instante en que el sistema obtuvo el tipo, no el del alta. CUANDO se reutiliza un tipo vigente, DEBERÁ guardar la fecha de su obtención. El tipo y su fecha forman un par: una simulación DEBERÁ guardar siempre el par exacto que usó, aunque otra petición concurrente lo renueve. SI llegan varias peticiones simultáneas con la caché vacía o caducada, ENTONCES DEBERÁ responder correctamente a todas aunque haga varias llamadas a la API (no se exige que se unifiquen), y cada una usa un par válido (tipo, instante) obtenido en esa ronda.
- RF18: CUANDO llega un `GET /exchange-rates`, el sistema DEBERÁ responder 200 con `{ items: [...] }`, con un elemento por cada divisa distinta de EUR (`USD` y después `GBP`), cada uno con `currency`, `exchangeRate` (RF11) y `exchangeRateAt` (RF17), usando la misma caché y las mismas reglas que el alta (RF15 y RF16). SI no se puede obtener el tipo de alguna de las dos divisas, ENTONCES DEBERÁ responder 500 `EXCHANGE_RATE_UNAVAILABLE` sin tipos parciales (V2). DEBERÁ ignorar los parámetros de consulta y responder 404 `NOT_FOUND` a cualquier método distinto de `GET`, antes de leer el cuerpo (como RF19 de la 003). Los tipos que devuelve son solo informativos: lo que vale es el par que el alta congela (RF17).

### Lecturas y migración
- RF19: CUANDO se lee una simulación (`GET /simulations/:id` o el listado por cliente), o cuando cambia el tipo de mercado o expira la caché, el sistema DEBERÁ devolver la divisa, el tipo, su fecha y los importes convertidos guardados, sin llamar a la API ni reconvertir (RF14 y RF20 de la 003, ampliados).
- RF20: El sistema DEBERÁ incorporar los campos de RF8 con una migración **idempotente**, que funcione igual en una base nueva y en una creada con la 003 y que no falle ni cambie nada si se ejecuta dos veces. Las columnas nuevas son obligatorias (no nulas) y con valor por defecto: `currency` `EUR`, tipo `"1.000000"`, `exchangeRateAt` igual al `createdAt` de la fila e importes convertidos iguales a los de euros. Las filas existentes se tratan como EUR (U5): sus importes en euros, su `createdAt` y el orden del listado no cambian. La clave foránea `ON DELETE RESTRICT` y `PRAGMA foreign_keys = ON` se mantienen.

## Forma de la simulación (ampliación)
Se añaden estos campos a la forma de la 003 (los demás no cambian):

| Campo | Tipo | Notas |
|---|---|---|
| `currency` | `"EUR"`, `"USD"` o `"GBP"` | `"EUR"` por defecto |
| `exchangeRate` | texto con 6 decimales fijos | `"1.000000"` en EUR; de `"0.010000"` a `"100.000000"` |
| `exchangeRateAt` | texto | formato de `toISOString()` |
| `convertedBaseCents` | entero ≥ 0 | |
| `convertedVatCents` | entero ≥ 0 | |
| `convertedTotalCents` | entero ≥ 0 | = base convertida + IVA convertido |

Ejemplo: cliente 7 (`ES`), 15 usuarios, divisa `USD`, tipo ilustrativo 1,10:
```json
{
  "id": 2, "customerId": 7, "users": 15, "storage": 0, "apiCalls": 0,
  "tiers": [ "...los tres tramos en céntimos de euro, sin convertir..." ],
  "baseCents": 14000, "country": "ES", "vatRatePercent": 21, "vatCents": 2940, "totalCents": 16940,
  "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z",
  "convertedBaseCents": 15400, "convertedVatCents": 3234, "convertedTotalCents": 18634,
  "createdAt": "2026-11-13T09:30:00.000Z"
}
```

Ejemplo de `GET /exchange-rates`:
```json
{ "items": [
  { "currency": "USD", "exchangeRate": "1.100000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" },
  { "currency": "GBP", "exchangeRate": "0.850000", "exchangeRateAt": "2026-11-13T09:00:00.000Z" }
] }
```

Ejemplo de error de divisa no disponible:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Datos no válidos.",
  "details": { "fields": [ { "field": "currency", "code": "CURRENCY_NOT_AVAILABLE",
    "message": "Divisa no disponible.", "suggestion": "EUR, USD, GBP" } ] } } }
```

## Catálogo de errores (nuevos)
| HTTP | `code` | Detalle | RF | Mensaje (orientativo) |
|---|---|---|---|---|
| 400 | `VALIDATION_ERROR` | `INVALID_TYPE` en `currency` | RF13 | "La divisa debe ser un texto." |
| 400 | `VALIDATION_ERROR` | `INVALID_CURRENCY` en `currency` | RF13 | "La divisa debe tener tres letras mayúsculas." |
| 400 | `VALIDATION_ERROR` | `CURRENCY_NOT_AVAILABLE` en `currency`, con `suggestion` | RF13 | "Divisa no disponible." |
| 404 | `NOT_FOUND` | método no definido sobre `/exchange-rates` | RF18 | "La ruta solicitada no existe." |
| 500 | `EXCHANGE_RATE_UNAVAILABLE` | sin `details` | RF16, RF18 | "No se pudo obtener el tipo de cambio. Inténtalo de nuevo más tarde." |

## Casos límite (entrada → salida esperada)
Salvo que se diga otra cosa: el cliente 7 existe con país `ES`, el 8 con `US` y el 999 no existe. Los tipos son **ilustrativos** (1 EUR = 1,10 USD y 0,85 GBP) y los tests los fijan.

### Validación de `currency`
| `currency` | Salida |
|---|---|
| ausente, `"EUR"` | 201, EUR, tipo `"1.000000"`, importes convertidos = importes en euros, sin llamar a la API |
| `"USD"`, `"GBP"` | 201 con conversión |
| `"JPY"`, `"CHF"`, `"MXN"`, `"XXX"` | 400 `CURRENCY_NOT_AVAILABLE` con `suggestion` `"EUR, USD, GBP"`; no se guarda nada |
| `"usd"`, `"Usd"`, `" USD "`, `"   "`, `""`, `"USD\n"` | 400 `INVALID_CURRENCY` |
| `"US"`, `"USDD"`, `"U$D"`, `"123"` | 400 `INVALID_CURRENCY` |
| `null`, `34`, `true`, `{}`, `["USD"]` | 400 `INVALID_TYPE` |
| `{customerId: "x", users: -1, currency: "JPY", foo: 1}` | cuatro errores en el orden `customerId`, `users`, `currency`, `foo` |
| `{customerId: 7, users: 15, storage: -1, apiCalls: -1, currency: "JPY"}` | tres errores en el orden `storage`, `apiCalls`, `currency` |
| `{customerId: 999, users: 15, currency: "JPY"}` | 400 `CURRENCY_NOT_AVAILABLE` (se valida antes que el cliente, RF14) |
| `{customerId: 999, users: 15, currency: "USD"}` | 404 `CUSTOMER_NOT_FOUND`, sin llamar a la API |
| `{customerId: 7, users: 15, currency: "USD", exchangeRate: "2"}` | 400 `UNKNOWN_FIELD` en `exchangeRate` |
| Cliente con país `XX` insertado directamente, `currency: "USD"` | 500 `INTERNAL_ERROR` (RF12 de la 003), sin llamar a la API y sin guardar nada (RF14) |

### Tramos e IVA en otra divisa (USD, tipo 1,10; `ES` salvo indicación)
| Usuarios | Base / IVA / Total (€) | Base / IVA / Total (USD) |
|---|---|---|
| 0 | 0,00 / 0,00 / 0,00 | 0,00 / 0,00 / 0,00 (+0) |
| 1 | 10,00 / 2,10 / 12,10 | 11,00 / 2,31 / 13,31 |
| 10 | 100,00 / 21,00 / 121,00 | 110,00 / 23,10 / 133,10 |
| 11 | 108,00 / 22,68 / 130,68 | 118,80 / 24,95 / 143,75 (2 268 × 1,10 = 2 494,8 céntimos → 2 495) |
| 15 | 140,00 / 29,40 / 169,40 | 154,00 / 32,34 / 186,34 |
| 50 | 420,00 / 88,20 / 508,20 | 462,00 / 97,02 / 559,02 |
| 51 | 425,00 / 89,25 / 514,25 | 467,50 / 98,18 / 565,68 (8 925 × 1,10 = 9 817,5 céntimos → 9 818, exactamente a medio céntimo) |
| 100 000 | 500 170,00 / 105 035,70 / 605 205,70 | 550 187,00 / 115 539,27 / 665 726,27 |
| 100 000, `PT` (23 %, importe máximo) | 500 170,00 / 115 039,10 / 615 209,10 | 550 187,00 / 126 543,01 / 676 730,01 |
| 15, cliente `US` (0 %) | 140,00 / 0,00 / 140,00 | 154,00 / 0,00 / 154,00 |

Con 51 usuarios, el IVA convertido cae exactamente a medio céntimo antes de redondear: es la fila que comprueba half-up y no otro redondeo.

### Redondeo de la conversión
| Importe en euros | Tipo | Convertido | Comprobación |
|---|---|---|---|
| 0,05 | 1,10 | 0,06 | 5,5 céntimos → 6 (half-up) |
| 0,10 | 0,85 (GBP) | 0,09 | 8,5 céntimos → 9 (half-up) |
| 0,01 | 0,85 (GBP) | 0,01 | 0,85 → 1 |
| 0,01 | 0,40 (artificial: no es un tipo real de USD ni GBP, solo prueba el redondeo a 0 dentro del rango válido) | 0,00 | 0,4 → 0; el resultado cumple `Object.is(x, -0) === false` |
| 108,00 base y 24,84 IVA (11 usuarios, `PT`) | 0,85 (GBP) | 91,80 y 21,11, total 112,91 | el total es la suma de los convertidos (RF5) |

**Total sumado frente a total convertido (RF5, RF7)**, `ES`, 1 usuario (base 1 000, IVA 210, total 1 210 céntimos):
| Tipo | Base convertida | IVA convertido | Total = suma | Convertir el total | Qué se comprueba |
|---|---|---|---|---|---|
| 1,003500 | 1 003,5 → 1 004 | 210,735 → 211 | **1 215** | 1 214,235 → **1 214** | el total DEBE ser 1 215 (suma), no 1 214 |
| 1,002400 | 1 002,4 → 1 002 | 210,504 → **211** | 1 213 | 1 212,904 → 1 213 | el IVA convertido (211) ≠ 21 % × base convertida (21 % × 1 002 = 210,42 → **210**); DEBE ser 211 (RF7) |

Los dos tests deben fallar si alguien calcula el total convirtiendo `totalCents` o el IVA como el 21 % de la base convertida.

### Tipo de cambio: formato, rango y API
| Valor que devuelve la API (USD) | Salida |
|---|---|
| `1.1` | se guarda `"1.100000"` (1 100 000 micro-unidades) |
| `1.1234567` | se guarda `"1.123457"` (half-up a 6 decimales, sin pasar por float) |
| `0.0099996` | se redondea a `0.010000`: válido, límite inferior |
| `0.0099994` | se redondea a `0.009999`: fuera de rango, 500 `EXCHANGE_RATE_UNAVAILABLE` |
| `0.01`, `100`, `100.0000004` | válidos (`"0.010000"`, `"100.000000"`, `"100.000000"`) |
| `100.0000005` | se redondea a `100.000001`: fuera de rango, 500 |
| `0`, `-1`, `1e0`, `"abc"`, `""`, `null`, `NaN` | 500 `EXCHANGE_RATE_UNAVAILABLE`; no se guarda en caché |
| respuesta sin la divisa pedida o con forma inesperada (falla Zod) | 500 `EXCHANGE_RATE_UNAVAILABLE` |
| tipo 100 con 100 000 usuarios `PT` en USD | 201; producto de 6,15·10^15 exacto en enteros seguros (RF10) |

### Caché, tiempo y concurrencia
| Caso | Salida |
|---|---|
| `USD` con tipo obtenido hace 23 h 59 min 59,999 s | 201; sin llamar a la API; `exchangeRateAt` = instante de obtención del tipo |
| `USD` con tipo obtenido hace exactamente 24 h y API operativa | se renueva; 201 con el tipo nuevo |
| `USD` con tipo de 24 h o más y la API falla | 500 `EXCHANGE_RATE_UNAVAILABLE`; no se guarda nada; no se usa el tipo caducado |
| `USD` sin caché y la API falla (red, timeout de 5 s, respuesta inválida) | 500; no se guarda nada; la causa va al log, no a la respuesta |
| La API tarda más de 5 s | se corta; 500 `EXCHANGE_RATE_UNAVAILABLE` |
| El reloj va hacia atrás: tipo obtenido a las 10:00 y ahora son las 09:00 | antigüedad negativa: no vigente; se renueva; si falla, 500 (V4) |
| `USD` con caché vigente y `GBP` sin caché | cada divisa tiene su propia caché: se llama a la API solo por `GBP` |
| Dos o más `POST` simultáneos con `USD` y la caché vacía | todos 201; puede haber una o varias llamadas a la API; cada simulación guarda un par (tipo, instante) obtenido en esa ronda |
| Dos `POST` simultáneos con la caché vacía y la API caída | los dos 500; no se guarda nada |
| Reinicio del servidor | la caché está vacía; el primer `POST` en USD llama a la API |
| `EUR` con la API caída | 201; no se llama a la API |
| `GBP` y la API solo tiene tipo de `USD` | 500 `EXCHANGE_RATE_UNAVAILABLE` |

### `GET /exchange-rates`
| Caso | Salida |
|---|---|
| Caché vigente de USD y GBP | 200; `items` con `USD` y `GBP` en ese orden; sin llamar a la API |
| Caché vacía y la API responde | 200; los dos tipos y su instante de obtención |
| Falla el tipo de GBP y USD está bien | 500 `EXCHANGE_RATE_UNAVAILABLE`, sin tipos parciales (V2) |
| `GET /exchange-rates?currency=USD` | se ignoran los parámetros: 200 con las dos divisas |
| `POST`, `PUT`, `PATCH` o `DELETE /exchange-rates`, también con JSON no válido | 404 `NOT_FOUND`, no 400 |
| Un `GET /exchange-rates` y un `POST /simulations` en USD con la misma caché | el alta congela el par vigente en ese momento; no tiene por qué coincidir con el visto en la vista previa |

### Congelación y migración
| Caso | Salida |
|---|---|
| Crear en USD con tipo 1,10, cambiar el tipo a 1,20 y hacer `GET /simulations/:id` | sigue `"1.100000"` y los mismos importes convertidos (RF19) |
| Fila guardada con `convertedBaseCents` 99900 que no cuadra con su tipo | `GET` devuelve 99900 (congelación) |
| Base creada con la 003 y simulaciones existentes, al arrancar | la migración añade las columnas; las simulaciones salen como `EUR`, `"1.000000"`, `exchangeRateAt` = `createdAt`, importes convertidos = euros; sus importes en euros y el orden del listado no cambian |
| Arrancar dos veces seguidas sobre la misma base | la segunda migración no falla ni cambia datos (idempotente) |
| Arrancar sobre una base nueva | se crean las tablas ya con las columnas, y las columnas nuevas son obligatorias (no aceptan nulos) |
| Listado de un cliente con simulaciones en EUR, USD y GBP | cada una con su divisa y tipo; orden `createdAt` DESC, `id` DESC |
| `GET /simulations/:id?currency=GBP` | se ignoran los parámetros (RF18 de la 003); la respuesta es la guardada |

### Casos límite obligatorios que no aplican aquí
- Letras de control de DNI, NIE y CIF: no aplican; están en la 001.

## Criterios de aceptación
- CA1: Cada fila de las tablas de casos límite tiene un test automatizado que la reproduce y pasa. Los tests de la API usan un proveedor de tipos simulado y un reloj controlado; nunca llaman a una API real.
- CA2: La función de conversión (RF5 a RF10) se prueba aislada, sin servidor, base de datos, red ni fecha, y recibe micro-unidades. Un test la importa y la usa desde el código que servirá a la interfaz (`shared/`), sin APIs de Node.
- CA3: Para `EUR`, `USD` y `GBP` y para los límites 0, 1, 10, 11, 50 y 51: los importes en euros coinciden con `calculateQuote`; todos los importes convertidos cumplen `Number.isSafeInteger` y `>= 0`; ninguno cumple `Object.is(x, -0)`; y `convertedTotalCents === convertedBaseCents + convertedVatCents`.
- CA4: Ninguna petición rechazada (400, 404 o 500) deja una simulación guardada, tampoco las que fallan por el tipo de cambio. El test cuenta las filas antes y después.
- CA5: Los tests de la 003, ajustados solo en los campos nuevos de la forma de la simulación y en el orden de errores, pasan; y existe un test que comprueba que las respuestas de la 003 con `currency` ausente son idénticas a las anteriores salvo por los campos nuevos de RF8.
- CA6: Un test ejecuta la migración sobre una base con simulaciones de la 003, comprueba que sus datos se conservan y salen como EUR (RF20), y que ejecutarla dos veces no falla ni cambia nada. Otro test la ejecuta sobre una base nueva.
- CA7: Todas las respuestas de error siguen `{ error: { code, message, details? } }` y el 500 de RF16 no contiene datos internos (URL, clave, texto de la API ni traza).
- CA8: Comprobable antes de pasar a implementación: `docs/constitution.md` contiene el principio 2 con el texto propuesto, `specs/003-simulations/spec.md` tiene aplicada cada línea de la lista de enmiendas, y `MEMORY.md` contiene D15, D14 ampliada y el estado de la 004 en `spec aprobada`.
- CA9: Un test de propiedades cubre el rango del tipo (10 000, 1 000 000 y 100 000 000 micro-unidades) con los importes máximos de la 002 y comprueba que el producto intermedio es un entero seguro y que el resultado coincide con el cálculo exacto de referencia del test.
- CA10: `npm test` y `npm run lint` terminan sin errores.

## Supuestos y dependencias
- DEP1: Depende de la 003 (alta, forma de la simulación, errores de campo, orden de comprobación) y de la 002 (`calculateQuote`).
- S1: El proveedor concreto de la API, su URL y si requiere clave los decide el plan. La spec solo exige lo observable: tipo EUR→USD y EUR→GBP, timeout de 5 s, validación Zod, fallo explícito y caché de 24 h. Cualquier dependencia nueva se justifica en el plan (CLAUDE.md).
- S2: El tipo es un valor de referencia para presupuestar, no una cotización contractual.
- S3: Los países y las divisas son independientes: un cliente `ES` puede presupuestarse en `USD` y uno `US` en `EUR`.
- S4: Un único proceso de backend. La caché en memoria no se comparte entre procesos.

## Fuera de alcance
- Calcular el precio en una divisa distinta de EUR, precios por divisa y tramos convertidos (RF6).
- Divisas distintas de EUR, USD y GBP, y divisas con otros decimales (JPY).
- Divisa preferida por cliente, y reconversión de simulaciones existentes a otra divisa.
- Caché persistente o compartida, renovación en segundo plano y unificación de peticiones concurrentes.
- Historial de tipos, comisiones, spreads y cobros.
- Selector de divisa y vista previa en pantalla → spec 005. Datos de ejemplo → spec 006.
- Facturas legales en divisa extranjera.

## Trazabilidad
Al aprobar esta spec, el coordinador debe: (1) aplicar las enmiendas de "Enmiendas necesarias" a `docs/constitution.md` (principio 2) y a `specs/003-simulations/spec.md`; (2) registrar en `MEMORY.md` la decisión D15 (U1 a U9 y los códigos nuevos `INVALID_CURRENCY`, `CURRENCY_NOT_AVAILABLE` y `EXCHANGE_RATE_UNAVAILABLE`, el endpoint `GET /exchange-rates` y el tipo en micro-unidades), ampliar D14 y reflejar el principio 2 enmendado; (3) cambiar el estado de `004-currency` a `spec aprobada`.

## Preguntas abiertas
Ninguna. Los valores V1 a V5 son por defecto del planner y se confirman o cambian al aprobar.
