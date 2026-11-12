# 002 · Coste base por tramos de usuarios e IVA por país
Estado: aprobada

> **Implementación:** todos los importes se calculan y devuelven internamente como enteros en céntimos (D2) para evitar errores de coma flotante; 1,00 € = 100 céntimos. Los tests comparan en céntimos: 140,00 € ⇒ 14000.

## Contexto y objetivo (por qué)
El enunciado pide calcular el coste mensual base de un cliente con un algoritmo **acumulativo por tramos** de usuarios activos y sumarle el IVA del país del cliente. Es la parte del reto que se evalúa como "cálculo preciso de tramos", y la misma cifra tiene que verse en dos sitios: en el slider del formulario de simulación, en tiempo real (spec 005), y en la simulación que guarda el backend (spec 003).

Si los dos lados calculasen por separado, tarde o temprano el comercial vería en pantalla un importe distinto del que queda guardado. Por eso el cálculo es una única regla pura y determinista que comparten interfaz y backend (D3; constitución, principio 3), y el backend siempre recalcula sin fiarse de lo que envíe la interfaz.

Alcance: solo la regla de cálculo (tramos, IVA y desglose), sin endpoints, sin base de datos y sin conversión de divisa. Todos los importes son en euros, con precisión exacta de céntimo (ver la nota de implementación; D2; constitución, principio 2).

Según D4, el coste base depende **solo** del número de usuarios: el almacenamiento y las llamadas a la API no tienen precio en el enunciado, así que no entran en este cálculo. El plan del cliente tampoco (D9).

## Decisiones del usuario (12 nov 2026)
- U1 · Tramos: fijos, en una única definición compartida en `shared/` y sin configuración; cambiar un precio o un límite exige un cambio de spec. *Descartado:* tramos configurables por entorno o en base de datos, porque obligarían a sincronizar interfaz y backend en tiempo de ejecución.
- U2 · Usuarios: de 0 a 100 000; 0 es válido y cuesta 0,00 €. *Descartado:* tope de 10 000, ningún límite de negocio y exigir al menos 1 usuario.
- U3 · País: estricto y sin normalizar (debe llegar en ISO 3166-1 alfa-2 y en mayúsculas). El 0 % solo se aplica a países ISO válidos que no están en la tabla. *Descartado:* que la regla normalice el país, y aplicar el 0 % a cualquier código desconocido, porque ocultaría errores.
- U4 · IVA: entra en esta spec, con la tabla fija de D5. *Descartado:* dejarlo para la 003, porque el slider de la 005 necesita el total con IVA en tiempo real.
- U5 · Desglose: siempre lleva los tres tramos, también los que no se usan. *Descartado:* incluir solo los tramos con usuarios, porque la forma del resultado dejaría de ser estable.
- U6 · IVA solo sobre la base de tramos: no hay una función de IVA sobre una base arbitraria. La base máxima es 500 170,00 € (100 000 usuarios). Incluso con el tipo más alto (23 %), el cálculo interno en céntimos (base × tipo ≤ 1 150 391 000) queda muy lejos del máximo entero seguro. Se mantiene la regla de redondeo half-up exacta con enteros (constitución, principio 2). *Descartado:* una función de IVA sobre bases arbitrarias (con su error `INVALID_AMOUNT`), un tope explícito para la base y usar BigInt.
- U7 · Errores del país con los mismos códigos que en la 001 (`REQUIRED`, `INVALID_TYPE` e `INVALID_COUNTRY`, con `suggestion: "GB"` para `UK`), salvo que aquí no se normaliza (U3): `"   "` da `INVALID_COUNTRY`. Se reutilizan la lista ISO y la lógica de sugerencia de la 001 sin duplicarlas (DEP1 en "Supuestos y dependencias"). `users` sigue el mismo criterio (`REQUIRED` si falta o es `null`). *Descartado:* un código propio `INVALID_COUNTRY` para todos los casos, incluidos los de tipo y ausencia.
- U8 · Campos ajenos: `storage`, `apiCalls`, `plan` y cualquier otro campo se ignoran sin error, y un test comprueba que no cambian el resultado (D4). El rechazo estricto de campos desconocidos lo hace Zod en el borde HTTP (spec 003). *Descartado:* rechazarlos en la regla de cálculo con `UNKNOWN_FIELD`.
- U9 · Spec redactada en euros; implementación en céntimos (D2). Los nombres de los campos de salida (`unitPriceCents`, `subtotalCents`, `baseCents`, `vatCents`, `totalCents`) son el contrato y no cambian. *Descartado:* redactar los importes en céntimos o con las dos unidades a la vez, porque cuesta contrastarlos con el enunciado.

## Glosario
- **Tramo:** rango de posiciones de usuario con un precio unitario fijo.

  | Tramo | Usuarios (posiciones) | Precio unitario (€) |
  |---|---|---|
  | 1 | 1.º a 10.º | 10,00 |
  | 2 | 11.º a 50.º | 8,00 |
  | 3 | 51.º en adelante | 5,00 |

  El enunciado describe el tramo 1 como "0 a 10 usuarios": con 0 usuarios no se factura nada, y el primer usuario facturable es el 1.º.
- **Acumulativo (gradual):** cada usuario se cobra al precio del tramo en el que cae su posición, no al del tramo que alcanza el total. Ejemplo del enunciado: 15 usuarios = 10 × 10,00 € + 5 × 8,00 € = 140,00 €.
- **Usuarios facturados en un tramo:** cuántos de los N usuarios caen dentro de ese tramo. Tramo 1 = min(N, 10); tramo 2 = min(max(N − 10, 0), 40); tramo 3 = max(N − 50, 0).
- **Coste base:** suma de los subtotales de los tres tramos, antes de IVA.
- **Tipo de IVA:** porcentaje entero según la tabla de D5: `ES` 21, `PT` 23, `FR` 20, `DE` 19, `IT` 22, `GB` 20, `US` 0 y 0 para el resto de países ISO válidos.
- **Redondeo half-up al céntimo:** se redondea el IVA al céntimo más cercano; si queda exactamente a medio céntimo, hacia arriba. Como la base nunca es negativa, no hay ambigüedad con los negativos.
- **País válido:** código que pasa el validador de país de la 001 (RF6 de la 001): ISO 3166-1 alfa-2 *officially assigned*, en mayúsculas, de la lista estática de esa spec.

## Requisitos funcionales (EARS)

### Coste base por tramos
- RF1 · Cálculo acumulativo: CUANDO se calcula el coste base de N usuarios válidos, el sistema DEBERÁ cobrar cada usuario al precio del tramo que corresponde a su posición (Glosario) y devolver como coste base la suma de los subtotales, con precisión exacta de céntimo (como entero en céntimos, D2).
- RF2 · Cero usuarios: CUANDO N es 0, el sistema DEBERÁ devolver un coste base de 0,00 €, con los tres tramos a 0 usuarios facturados y subtotal 0,00 €, sin ningún error.
- RF3 · Desglose: CUANDO se calcula el coste base, el sistema DEBERÁ devolver, para cada uno de los tres tramos y en orden, su número, su primera y última posición (la última es "sin límite" en el tramo 3), el precio unitario, los usuarios facturados y el subtotal (usuarios facturados × precio unitario). La suma de los subtotales DEBERÁ coincidir siempre con el coste base.
- RF4 · Definición única e inmutable de tramos: el sistema DEBERÁ tener una sola definición de los tramos (límites y precios), compartida por la interfaz y el backend, que no se pueda modificar en tiempo de ejecución. Se observa así:
  - la definición está congelada (`Object.freeze`, también en cada tramo) y tipada como `readonly`, de modo que modificarla es un error de tipos;
  - un test intenta cambiar un precio y un límite: la operación falla (modo estricto), y un cálculo posterior da el mismo resultado que antes. Para que el test pase el lint y la comprobación de tipos, la asignación prohibida se marca con `@ts-expect-error` (o con un cast documentado en un comentario), nunca con `any`.
- RF5 · Sin factores ajenos: CUANDO se calcula el coste base o el presupuesto, el sistema DEBERÁ usar solo el número de usuarios (y el país, para el IVA). SI la entrada trae otros campos (`storage`, `apiCalls`, `plan` u otros), ENTONCES el sistema DEBERÁ ignorarlos sin error y sin que cambie el resultado (D4, D9, U8).

### Validación del número de usuarios
La regla no confía en quien la llama: valida su entrada y, si no es válida, devuelve errores tipados sin lanzar excepciones ni devolver importes. Como en la 001, cada error lleva `field`, `code` y `message` (texto legible en español) y, si procede, `reason` o `suggestion`. Los códigos siguen el criterio de la 001 (RF3 de la 001).
- RF6 · Ausencia y tipo: SI `users` falta o vale `null`, ENTONCES el sistema DEBERÁ devolver `REQUIRED`. SI tiene otro tipo que no sea número (texto como `"15"` o `""`, booleano, objeto o array), ENTONCES DEBERÁ devolver `INVALID_TYPE`. A diferencia de la 001, el texto vacío `""` es `INVALID_TYPE` y no `REQUIRED`: en la 001 `REQUIRED` se aplica a campos de texto vacíos tras normalizar, y aquí `users` es numérico, así que cualquier texto es un tipo erróneo. Convertir texto a número es responsabilidad del borde HTTP (spec 003) o del formulario (spec 005).
- RF7 · Dominio: SI `users` es de tipo número pero no es válido, ENTONCES el sistema DEBERÁ devolver `INVALID_USERS` con el primer `reason` que falle de este orden:
  1. `NaN`, `Infinity` o `-Infinity` → `NOT_FINITE`;
  2. no entero → `NOT_INTEGER` (por ejemplo `1.5` o `100000.5`);
  3. menor que 0 → `NEGATIVE` (por ejemplo `-1`);
  4. mayor que 100 000 → `TOO_LARGE` (por ejemplo `100001`).

  Las notaciones que representan el mismo valor entero son el mismo número (`1e1` es 10). `-0` es válido y se trata como 0 (RF15).

### IVA
- RF8 · Tipo por país: CUANDO se calcula el presupuesto para un país válido, el sistema DEBERÁ aplicar el tipo de la tabla de D5. SI el país es válido pero no está en la tabla, ENTONCES DEBERÁ aplicar el 0 % y devolver el tipo 0 de forma explícita.
- RF9 · País no válido: el sistema DEBERÁ validar `country` con los mismos códigos que la 001 (RF3 y RF6 de la 001), salvo que aquí no se normaliza (U3). La comprobación se hace sobre el valor **tal como llega**, sin la normalización de RF2 de la 001, y es una capa propia de la 002 sobre la lista ISO y la sugerencia de `UK` que define la 001 (DEP1 en "Supuestos y dependencias"):
  - SI `country` falta, vale `null` o es `""`, ENTONCES DEBERÁ devolver `REQUIRED`;
  - SI no es texto (número, booleano, objeto o array, incluido `["ES"]`), ENTONCES DEBERÁ devolver `INVALID_TYPE`;
  - SI es texto pero no es un país válido (no está en la lista ISO, es un código reservado, va en minúsculas o lleva espacios, incluido `"   "`), ENTONCES DEBERÁ devolver `INVALID_COUNTRY`, sin aplicar el 0 % por defecto. Para `UK`, el error DEBERÁ incluir `suggestion: "GB"` y el mensaje "¿Querías decir GB?", igual que en la 001.
- RF10 · Cálculo y redondeo: CUANDO se calcula el IVA, el sistema DEBERÁ calcularlo solo sobre el coste base de los tramos (no hay IVA sobre otras bases, U6) como base × tipo / 100, redondeado half-up al céntimo más cercano con aritmética exacta de enteros, **una sola vez sobre el coste base total** y nunca tramo a tramo. Hay dos avisos explícitos:
  - con los precios actuales la base siempre son euros enteros y el tipo es un porcentaje entero, así que el IVA sale siempre exacto al céntimo y el redondeo **nunca se dispara**. Los tests no pueden distinguir el redondeo half-up de otro redondeo;
  - "no redondear por tramo" tampoco se puede distinguir con tests con estos precios: se verifica en la revisión de código (CA4).

### Resultados
- RF11 · Coste base sin país: CUANDO se calcula solo el coste base (sin país), el sistema DEBERÁ devolver `users`, el desglose de tramos (RF3) y el coste base; o, si `users` no es válido, solo la lista de errores con un único error en `users`. Este resultado no lleva campos de IVA.
- RF12 · Presupuesto: CUANDO se calcula el presupuesto de N usuarios para un país, el sistema DEBERÁ devolver `users`, el desglose de tramos (RF3), el coste base, el país, el tipo de IVA aplicado, el IVA y el total (coste base + IVA). Todos los importes se devuelven como enteros en céntimos de euro (D2).
- RF13 · Errores: SI `users` o `country` no son válidos, ENTONCES el sistema DEBERÁ devolver solo la lista de errores, sin importes. Tendrá como máximo un error por campo, siempre en el orden `users` y después `country`. Si solo falla uno de los dos campos, la lista tiene un único error.
- RF14 · Determinismo: CUANDO se calcula con las mismas entradas, el sistema DEBERÁ devolver exactamente el mismo resultado, sin depender de la fecha, el azar, la red, la base de datos ni la configuración regional.
- RF15 · Sin cero negativo: CUANDO se devuelve un resultado, todas sus salidas numéricas (usuarios, usuarios facturados, subtotales, base, tipo, IVA y total) DEBERÁN ser +0 cuando valgan cero, nunca −0 (`Object.is(valor, -0)` es falso), también con la entrada `-0`.
- RF16 · Entrada que no es un objeto: SI la entrada completa del cálculo (coste base o presupuesto) no es un objeto (`null`, `undefined`, array, número, texto o booleano), ENTONCES el sistema DEBERÁ devolver un único error `{ field: "input", code: "INVALID_TYPE", message }`, sin validar `users` ni `country` y sin lanzar excepciones. Sigue el patrón de RF29 de la 001, que usa `field: "body"` para la petición HTTP; aquí no hay cuerpo HTTP, así que el campo es `input`.

## Forma del resultado (orientativa)
Presupuesto para 15 usuarios en `ES`: 140,00 € de base, 29,40 € de IVA y 169,40 € de total. El JSON muestra la salida real, con los importes como enteros en céntimos (14000 = 140,00 €):
```json
{
  "users": 15,
  "tiers": [
    { "tier": 1, "from": 1,  "to": 10,   "unitPriceCents": 1000, "billedUsers": 10, "subtotalCents": 10000 },
    { "tier": 2, "from": 11, "to": 50,   "unitPriceCents": 800,  "billedUsers": 5,  "subtotalCents": 4000 },
    { "tier": 3, "from": 51, "to": null, "unitPriceCents": 500,  "billedUsers": 0,  "subtotalCents": 0 }
  ],
  "baseCents": 14000,
  "country": "ES",
  "vatRatePercent": 21,
  "vatCents": 2940,
  "totalCents": 16940
}
```
Coste base sin país (RF11), con 15 usuarios: el mismo objeto con solo `users`, `tiers` y `baseCents`.

Errores (usuarios `-1` y país `UK`), en el orden `users` y después `country`:
```json
{
  "errors": [
    { "field": "users", "code": "INVALID_USERS", "reason": "NEGATIVE", "message": "El número de usuarios no puede ser negativo." },
    { "field": "country", "code": "INVALID_COUNTRY", "suggestion": "GB", "message": "¿Querías decir GB?" }
  ]
}
```
Entrada que no es un objeto (RF16):
```json
{ "errors": [ { "field": "input", "code": "INVALID_TYPE", "message": "La entrada del cálculo debe ser un objeto." } ] }
```
Los nombres y los textos de `message` son orientativos; el plan fija la forma exacta. Lo obligatorio es el contenido de RF3, RF11 a RF13 y RF16, y que todo error lleve `field`, `code` y `message`.

## Casos límite (entrada → salida esperada)
Todos los importes en euros. Los tests los comparan en céntimos (ver la nota de implementación).

### Coste base por número de usuarios
| Usuarios | Tramo 1 / 2 / 3 (usuarios facturados) | Coste base (€) | Comprobación |
|---|---|---|---|
| 0 | 0 / 0 / 0 | 0,00 | sin usuarios |
| 1 | 1 / 0 / 0 | 10,00 | 1 × 10,00 € |
| 9 | 9 / 0 / 0 | 90,00 | 9 × 10,00 € |
| 10 | 10 / 0 / 0 | 100,00 | 10 × 10,00 € (último del tramo 1) |
| 11 | 10 / 1 / 0 | 108,00 | 100,00 € + 1 × 8,00 € (primero del tramo 2) |
| 15 | 10 / 5 / 0 | 140,00 | 100,00 € + 5 × 8,00 € (ejemplo del enunciado) |
| 49 | 10 / 39 / 0 | 412,00 | 100,00 € + 39 × 8,00 € |
| 50 | 10 / 40 / 0 | 420,00 | 100,00 € + 40 × 8,00 € (último del tramo 2) |
| 51 | 10 / 40 / 1 | 425,00 | 420,00 € + 1 × 5,00 € (primero del tramo 3) |
| 52 | 10 / 40 / 2 | 430,00 | 420,00 € + 2 × 5,00 € |
| 100 | 10 / 40 / 50 | 670,00 | 420,00 € + 50 × 5,00 € |
| 1 000 | 10 / 40 / 950 | 5 170,00 | 420,00 € + 950 × 5,00 € |
| 100 000 | 10 / 40 / 99 950 | 500 170,00 | 420,00 € + 99 950 × 5,00 € (máximo admitido) |
| `1e1` | 10 / 0 / 0 | 100,00 | es el mismo número que 10 |
| `-0` | 0 / 0 / 0 | 0,00 | `users` 0 y todas las salidas +0 (RF15) |
| 15 con `storage: 999`, `apiCalls: 1000000`, `plan: "enterprise"` | 10 / 5 / 0 | 140,00 | idéntico al resultado sin esos campos (RF5) |

Contraste con el cálculo **no** acumulativo, que es incorrecto: 11 usuarios × 8,00 € serían 88,00 € (en lugar de 108,00 €) y 51 usuarios × 5,00 € serían 255,00 € (en lugar de 425,00 €). Los tests de 11 y 51 usuarios deben fallar si alguien implementa esa variante.

### Número de usuarios no válido
| Entrada `users` | Salida |
|---|---|
| `-1` | `INVALID_USERS`, `NEGATIVE` |
| `1.5`, `10.01` | `INVALID_USERS`, `NOT_INTEGER` |
| `-1.5` | `INVALID_USERS`, `NOT_INTEGER` (va antes que `NEGATIVE`) |
| `100000.5` | `INVALID_USERS`, `NOT_INTEGER` (va antes que `TOO_LARGE`) |
| `100001`, `1e9` | `INVALID_USERS`, `TOO_LARGE` |
| `NaN`, `Infinity`, `-Infinity` | `INVALID_USERS`, `NOT_FINITE` |
| `null`, ausente | `REQUIRED` |
| `"15"`, `""`, `true`, `{}`, `[]`, `[15]` | `INVALID_TYPE` |

### IVA por país (presupuesto completo)
| Usuarios | País | Base (€) | Tipo (%) | IVA (€) | Total (€) |
|---|---|---|---|---|---|
| 0 | `ES` | 0,00 | 21 | 0,00 | 0,00 |
| 1 | `ES` | 10,00 | 21 | 2,10 | 12,10 |
| 15 | `ES` | 140,00 | 21 | 29,40 | 169,40 |
| 51 | `PT` | 425,00 | 23 | 97,75 | 522,75 |
| 11 | `FR` | 108,00 | 20 | 21,60 | 129,60 |
| 15 | `DE` | 140,00 | 19 | 26,60 | 166,60 |
| 100 | `IT` | 670,00 | 22 | 147,40 | 817,40 |
| 1 | `GB` | 10,00 | 20 | 2,00 | 12,00 |
| 50 | `US` | 420,00 | 0 | 0,00 | 420,00 |
| 10 | `MX` (válido, fuera de la tabla) | 100,00 | 0 | 0,00 | 100,00 |
| 100 000 | `ES` | 500 170,00 | 21 | 105 035,70 | 605 205,70 |
| 100 000 | `PT` (tipo máximo) | 500 170,00 | 23 | 115 039,10 | 615 209,10 |
| `-0` | `US` | 0,00 | 0 | 0,00 | 0,00 (todo +0, RF15) |

### País no válido
Salvo que se indique otra cosa, en estas filas `users` = 15 (válido), así que la lista de errores solo tiene el error de `country`.

| Entrada `country` | Salida |
|---|---|
| `null`, ausente, `""` | `REQUIRED` |
| `34`, `true`, `{}`, `["ES"]` | `INVALID_TYPE` |
| `es`, `Es`, ` ES `, `"   "` | `INVALID_COUNTRY` (sin normalizar, U3) |
| `UK` | `INVALID_COUNTRY`, `suggestion: "GB"`, mensaje "¿Querías decir GB?" |
| `XX`, `EU`, `EL`, `XK`, `ESP`, `E` | `INVALID_COUNTRY` |
| `users` = `-1`, `country` = `XX` | dos errores, en este orden: `INVALID_USERS` (`NEGATIVE`) en `users` e `INVALID_COUNTRY` en `country` |
| `users` = ausente, `country` = `null` | dos errores, en este orden: `REQUIRED` en `users` y `REQUIRED` en `country` |
| `users` = `-1`, `country` = `ES` | un solo error: `INVALID_USERS` (`NEGATIVE`) en `users` |

### Entrada que no es un objeto (RF16)
Se aplica igual al cálculo del coste base y al del presupuesto. Todas las filas devuelven un único error con `message` y nunca lanzan una excepción.

| Entrada completa | Salida |
|---|---|
| `null`, `undefined` (sin argumento) | `INVALID_TYPE` en `input` |
| `[]`, `[15, "ES"]` | `INVALID_TYPE` en `input` |
| `15`, `"15"`, `true` | `INVALID_TYPE` en `input` |
| `{}` (objeto vacío) | no aplica RF16: es un objeto; presupuesto → `REQUIRED` en `users` y `REQUIRED` en `country` |

### Redondeo del IVA
No hay filas de redondeo: con los precios actuales nunca se dispara (RF10, U6). En cualquier presupuesto válido el IVA sale exacto al céntimo, y la tabla de IVA por país lo comprueba con importes exactos.

### Casos límite obligatorios que no aplican aquí
- Letras de control de DNI, NIE y CIF: no aplican; están en la 001. Esta spec solo usa el país.
- Divisas no disponibles: no aplican; 004-currency. Esta regla siempre trabaja en euros, y la conversión ocurre solo en la capa de presentación (constitución, principio 2).

## Criterios de aceptación
- CA1: Cada fila de las tablas de casos límite tiene un test automatizado que la reproduce y pasa (comparando en céntimos).
- CA2: La regla se prueba de forma aislada, sin servidor, base de datos ni red. El código de `shared/` que la implementa no depende de APIs de Node, de E/S, de la fecha ni del azar, para que pueda ejecutarse en el navegador (RF14). Que la interfaz obtiene los mismos resultados se verifica en la 005.
- CA3: Tests de propiedades sobre todos los N de 0 a 100 000:
  - la suma de usuarios facturados de los tres tramos es igual a N;
  - la suma de los subtotales es igual al coste base;
  - el coste base crece estrictamente con N, y el incremento al pasar de N − 1 a N es 10,00 €, 8,00 € o 5,00 € según el tramo de la posición N;
  - para cada país de D5 (`ES`, `PT`, `FR`, `DE`, `IT`, `GB`, `US`) y para `MX`: IVA = base × tipo / 100 exacto, y total = base + IVA.
- CA4: Precisión con enteros:
  - *Verificable por test:* en la propiedad de CA3, todos los importes devueltos (subtotales, base, IVA y total, en céntimos) y los usuarios facturados son enteros seguros ≥ 0 (`Number.isSafeInteger`) y ninguno es −0 (RF15).
  - *Verificable en revisión de código:* el cálculo usa solo operaciones con enteros (sin multiplicar por fracciones como 0,21), el redondeo half-up se hace una sola vez sobre el coste base total y nunca tramo a tramo (RF10).
- CA5: Ninguna entrada no válida devuelve importes ni lanza una excepción, tampoco una entrada que no es un objeto (RF16): siempre devuelve los errores tipados de RF6, RF7, RF9, RF13 y RF16, en el orden de RF13, y cada error lleva `field`, `code` y `message`.
- CA6: El test de inmutabilidad de RF4 pasa, y el test de campos ajenos de RF5 demuestra que el resultado es idéntico con y sin `storage`, `apiCalls` y `plan`.
- CA7: `npm test` y `npm run lint` terminan sin errores, incluido el test de inmutabilidad, que usa `@ts-expect-error` (o un cast documentado) y no `any` (RF4).

## Supuestos y dependencias
- DEP1 · Dependencia con la 001: la 002 reutiliza la lista ISO 3166-1 y la lógica de sugerencia de `UK` que define la 001 (RF6 de la 001; su tarea T6, en `shared/src/countries/`). La comprobación estricta sin normalizar (RF9) es una capa propia de la 002 sobre esa lista. Si al planificar la 002 la T6 de la 001 aún no está implementada, el plan de la 002 tiene que adelantar esa pieza o compartirla con la 001, sin duplicar la lista ni la sugerencia.
- S1: El tramo 1 del enunciado ("0 a 10") se interpreta como las posiciones 1.ª a 10.ª; con 0 usuarios el coste es 0,00 €.
- S2: Todos los precios del enunciado son en euros. El presupuesto se expresa siempre en euros, y la conversión a otra divisa es solo de visualización (004/005).
- S3: El país lo aporta el cliente ya registrado (001), que lo guarda normalizado. Por eso la regla exige el código ya normalizado en vez de normalizarlo ella (U3).
- S4: El IVA es un porcentaje entero (los de D5 lo son). Admitir tipos con decimales (por ejemplo 5,5 %) o precios que no sean euros enteros exigiría un cambio de spec, que tendría que añadir filas en las que el redondeo sí se dispare.

## Fuera de alcance
- Endpoint `POST /simulations`, validación HTTP con Zod (incluido el rechazo de campos desconocidos) y recálculo en el backend → spec 003.
- Persistir simulaciones, el almacenamiento y las llamadas a la API → spec 003 (se guardan pero no suman, D4).
- Conversión de divisa, API de tipos de cambio y divisas no disponibles → spec 004.
- Slider, formulario, visualización del desglose y verificación en la interfaz → spec 005.
- IVA sobre bases arbitrarias que no procedan de los tramos (U6).
- Precios distintos por plan, descuentos, promociones, prorrateos y facturación anual.
- Tramos configurables desde la interfaz o la base de datos.
- IVA reducido, recargo de equivalencia, inversión del sujeto pasivo (B2B intracomunitario) e impuestos por estado en EE. UU.
- Facturas fiscales legales y su numeración.

## Trazabilidad
Al aprobar esta spec, el coordinador debe actualizar `MEMORY.md`:
- D5 tiene que aclarar que "resto" significa "resto de países ISO válidos: 0 %" (un código no válido es un error, no un 0 %);
- hay que registrar las decisiones U1 a U9 de esta spec;
- hay que cambiar el estado de `002-tiered-pricing` en la tabla "Estado de specs" (de `pendiente` a `spec aprobada`).

## Preguntas abiertas
Ninguna.
