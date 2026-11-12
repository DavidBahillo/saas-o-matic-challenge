# 001 · Clientes corporativos con validación del identificador fiscal
Estado: aprobada

## Contexto y objetivo (por qué)
El equipo comercial necesita registrar a los clientes corporativos antes de simularles una suscripción (spec 003). El enunciado pide guardar nombre de empresa, identificador fiscal (DNI/NIF/CIF), email de contacto, país y plan elegido, y valora sobre todo la **robustez del backend**: validaciones correctas y persistencia limpia.

El riesgo principal es dar de alta clientes con un identificador fiscal falso o mal escrito, lo que invalidaría cualquier presupuesto posterior. Por eso, cuando el país es España, el identificador **debe** pasar el algoritmo oficial de dígito de control (constitución, principio 4). Por decisión del usuario, la misma exigencia se extiende a los demás países con IVA propio en la tabla D5: Portugal, Francia, Alemania, Italia y Reino Unido. También se exponen la consulta y la búsqueda de clientes, que necesitarán las specs 003 y 005 (buscador por nombre o identificador fiscal).

Es la primera spec del proyecto: su entrega incluye dejar el monorepo listo para arrancar y testear (ver Supuestos).

## Decisiones del usuario (12 nov 2026)
- Plan elegido: lista cerrada `starter`, `growth`, `enterprise`. Es solo informativo y no afecta al precio (D4).
- Identificador fuera de España: validación algorítmica también para PT, FR, DE, IT y GB; formato genérico para el resto.
- Unicidad por (país, identificador normalizado), con 409.
- Se incluyen `GET /customers?q=` y `GET /customers/:id`.
- País: cualquier código ISO 3166-1 alfa-2. `UK` se rechaza con `INVALID_COUNTRY` y la sugerencia "¿Querías decir GB?"; no es un alias.
- Francia: solo SIREN de 9 dígitos con Luhn (sin SIRET ni TVA).
- Reino Unido: solo VAT de 9 dígitos, válido por módulo 97 o 9755 (sin sucursal de 12 dígitos ni `GD`/`HA`).
- Portugal: basta con que el primer dígito no sea 0 (sin restringir a rangos de persona jurídica).
- Alemania: solo el USt-IdNr; la Steuernummer queda fuera de alcance.
- Italia: además del dígito de control, se valida el código de oficina (dígitos 8 a 10).
- Identificadores cuya parte numérica es solo ceros: se rechazan con `TAX_ID_INVALID_FORMAT` en todos los países con algoritmo.
- DNI de 7 dígitos y NIE antiguo de 8 dígitos: se rechazan con `TAX_ID_INVALID_FORMAT`, sin rellenar con ceros.
- Los validadores del identificador fiscal son lógica pura y reutilizable por la interfaz (RF9).
- Andamiaje (S1): en la 001 solo se crean `shared/` y `backend/`; `frontend/` se crea en la 005.
- Prefijo de país (S2): se rechaza con `COUNTRY_PREFIX` (RF19).
- Email (S3): no es único y no se verifica que exista.
- Orden del listado: colación del español (RF24).
- Cuerpo con UTF-8 no válido o con BOM: 400 `MALFORMED_JSON` (RFC 8259 §8.1), en vez de guardar el texto corrupto con U+FFFD (RF28).
- `HEAD /customers` y `HEAD /customers/:id`: responden como un `GET` sin cuerpo (excepción explícita en RF30). `OPTIONS` da 404.

## Glosario
- **Identificador fiscal normalizado:** resultado de aplicar RF2 al `taxId`. Ejemplo: ` 12.345.678-z ` → `12345678Z`.
- **Prefijo de país:** las dos letras del país que encabezan los números de IVA intracomunitario (`ES`, `PT`, `FR`, `DE`, `IT`, `GB`). El identificador se introduce siempre **sin** prefijo, en su forma nacional (RF19).
- **Parte numérica:** los dígitos del identificador sin letras iniciales ni la letra de control. DNI: los 8 dígitos; NIE y CIF: los 7 dígitos centrales; PT, FR, DE, IT y GB: el identificador completo.
- **DNI (ES):** 8 dígitos + letra de control. Letra = `TRWAGMYFPDXBNJZSQVHLCKE`[número mod 23].
- **NIE (ES):** letra inicial `X`, `Y` o `Z` + 7 dígitos + letra de control. La inicial se sustituye por `0`, `1` o `2` y se aplica el algoritmo del DNI al número de 8 cifras resultante.
- **CIF (ES):** letra de tipo de entidad (`A B C D E F G H J N P Q R S U V W`) + 7 dígitos + carácter de control. A = suma de los dígitos en posiciones pares (2.ª, 4.ª y 6.ª); B = suma, para las posiciones impares (1.ª, 3.ª, 5.ª y 7.ª), de las cifras de cada dígito multiplicado por 2; D = (10 − ((A + B) mod 10)) mod 10. El control es el dígito D o la letra `JABCDEFGHI`[D]:
  - tipos `A B E H`: el control debe ser **dígito**;
  - tipos `N P Q R S W`: el control debe ser **letra**;
  - tipos `C D F G J U V`: se acepta dígito o letra.
- **NIF/NIPC (PT):** 9 dígitos y el primero no es 0. S = suma de los 8 primeros dígitos multiplicados por los pesos 9, 8, 7, 6, 5, 4, 3, 2. Control = 11 − (S mod 11); si el resultado es 10 u 11, el control es 0.
- **SIREN (FR):** 9 dígitos con Luhn: empezando por la izquierda, se duplican los dígitos en posiciones pares (2.ª, 4.ª, 6.ª y 8.ª) y se resta 9 a cada resultado mayor que 9. La suma de todos los dígitos así tratados debe ser múltiplo de 10.
- **USt-IdNr (DE), parte numérica:** 9 dígitos y el primero no es 0. ISO 7064 MOD 11,10 sobre los 8 primeros: P = 10; para cada dígito d, s = (d + P) mod 10 (si s = 0, s = 10) y P = (2 · s) mod 11. Control = 11 − P; si el resultado es 10, el control es 0.
- **Partita IVA (IT):** 11 dígitos. Dígitos 1 a 7: matrícula; dígitos 8 a 10: código de oficina, válido si es `001`–`100`, `120`, `121`, `888` o `999`; dígito 11: control. X = suma de los dígitos en posiciones impares 1.ª a 9.ª; Y = suma, para las posiciones pares 2.ª a 10.ª, de cada dígito multiplicado por 2 (restando 9 si supera 9). Control = (10 − ((X + Y) mod 10)) mod 10.
- **VAT (GB):** 9 dígitos. S = suma de los 7 primeros multiplicados por los pesos 8, 7, 6, 5, 4, 3, 2; C = número formado por los 2 últimos dígitos. Es válido si (S + C) mod 97 = 0 (módulo 97) **o** si (S + 55 + C) mod 97 = 0 (variante 9755). *Nota informativa:* HMRC introdujo la variante 9755 para las series de números más recientes. Esta spec no distingue series y acepta las dos.
- **Tipo de identificador (`taxIdType`):** `DNI`, `NIE`, `CIF`, `PT_NIF`, `FR_SIREN`, `DE_VAT`, `IT_PIVA`, `GB_VAT` u `OTHER`.
- **Espacio en blanco (para el trim):** espacio U+0020, tabulador U+0009, salto de línea U+000A y U+000D, espacio duro U+00A0 y espacio estrecho U+202F.

## Requisitos funcionales (EARS)

### Alta de clientes
- RF1 · Alta válida: CUANDO se recibe un alta de cliente con todos los campos válidos, el sistema DEBERÁ guardarlo y responder 201 con el cliente creado (incluidos `id`, `taxId` normalizado, `taxIdType` y `createdAt`).
- RF2 · Normalización: CUANDO se recibe un alta, el sistema DEBERÁ normalizar los campos antes de validarlos y guardarlos, así:
  - `companyName`: forma Unicode NFC y trim de espacios en blanco; se conservan tildes, mayúsculas y espacios internos.
  - `email`: trim y minúsculas.
  - `country`: trim y mayúsculas solo en A–Z.
  - `plan`: trim, sin cambiar mayúsculas ni minúsculas.
  - `taxId`: primero, trim con la definición de espacio en blanco del Glosario (incluye U+000A y U+000D); después se eliminan en cualquier posición el espacio U+0020, el tabulador U+0009, los espacios duros U+00A0 y U+202F, los guiones U+002D, U+2010, U+2011, U+2012, U+2013, U+2014 y U+2212, y el punto U+002E; después se pasan a mayúsculas **solo** las letras a–z. No se hace ninguna otra conversión: `ß`, `ñ` y demás caracteres no ASCII se quedan como están y fallan la validación de formato.
- RF3 · Campos obligatorios y tipos: SI un campo obligatorio (`companyName`, `taxId`, `email`, `country`, `plan`) falta, vale `null` o queda vacío tras la normalización, ENTONCES el sistema DEBERÁ indicar `REQUIRED` en ese campo. SI tiene un tipo distinto de texto, DEBERÁ indicar `INVALID_TYPE`. SI llega un campo no previsto, DEBERÁ indicar `UNKNOWN_FIELD`. En todos los casos la respuesta es 400 `VALIDATION_ERROR` con todos los campos erróneos en `details.fields` (un error por campo), no solo el primero.
- RF4 · Nombre de empresa: SI `companyName` normalizado tiene menos de 2 o más de 120 code points, ENTONCES el sistema DEBERÁ indicar `INVALID_LENGTH`. SI contiene caracteres de control (U+0000–U+001F, U+007F–U+009F, incluidos saltos de línea y tabuladores internos), ENTONCES DEBERÁ indicar `INVALID_CHARACTERS`. Este último código tiene precedencia sobre la longitud.
- RF5 · Email: SI `email` supera 254 code points, ENTONCES el sistema DEBERÁ indicar `INVALID_LENGTH`. SI no tiene un formato válido, ENTONCES DEBERÁ indicar `INVALID_EMAIL`. Un email es válido si cumple todo esto:
  - exactamente una `@`;
  - parte local no vacía;
  - dominio con al menos dos etiquetas separadas por punto, ninguna vacía (así se rechazan `a@b.` y `a@.es`);
  - sin espacios;
  - solo caracteres ASCII.

  Los dominios no ASCII (`ventas@acmé.es`) se rechazan: es una herramienta interna, los clientes corporativos usan dominios ASCII, y admitirlos obligaría a definir conversiones (IDN) y abriría la puerta a dominios visualmente engañosos.
- RF6 · País: SI `country` no es uno de los códigos ISO 3166-1 alfa-2 con estado *officially assigned*, ENTONCES el sistema DEBERÁ indicar `INVALID_COUNTRY`. La lista es estática y corresponde a la publicada por la ISO 3166 Maintenance Agency a 1 de noviembre de 2026; solo se actualiza con un cambio de spec. No se admiten los códigos reservados ni los de uso de usuario (`UK`, `EU`, `EL`, `XK`…). Para `UK`, el error DEBERÁ incluir `suggestion: "GB"` y el mensaje "¿Querías decir GB?".
- RF7 · Plan: SI `plan` normalizado no es exactamente `starter`, `growth` o `enterprise`, ENTONCES el sistema DEBERÁ indicar `INVALID_PLAN`. Los valores distinguen mayúsculas y minúsculas. El plan es solo informativo: no interviene en ningún cálculo.
- RF8 · País inválido y tax ID: SI `country` falta o no es válido, ENTONCES el sistema DEBERÁ comprobar `taxId` solo como `REQUIRED` o `INVALID_TYPE`, sin aplicar reglas de formato ni de control, porque dependen del país.

### Identificador fiscal
- RF9 · Validación reutilizable: CUANDO se valida un identificador fiscal, el sistema DEBERÁ aplicar unas reglas de normalización y validación deterministas, sin efectos secundarios ni dependencia de la base de datos o la red, y reutilizables tal cual por la interfaz. A igual país y valor, el resultado (válido con su `taxIdType` o error con su código y `reason`) DEBERÁ ser idéntico en la API y en la interfaz.
- RF10 · Orden de comprobación: CUANDO se valida `taxId` con un país válido, el sistema DEBERÁ devolver un único error, el primero que falle de este orden:
  1. vacío → `REQUIRED`;
  2. prefijo de país (RF19);
  3. forma y caracteres (RF11);
  4. parte numérica solo de ceros (RF18);
  5. reglas específicas del país: primer dígito en PT y DE (`TAX_ID_INVALID_FORMAT`, `reason: "FIRST_DIGIT"`) y código de oficina en IT (`TAX_ID_INVALID_FORMAT`, `reason: "IT_OFFICE_CODE"`);
  6. dígito o letra de control → `TAX_ID_INVALID_CHECKSUM`.
- RF11 · Formato y control: SI el país es `ES`, `PT`, `FR`, `DE`, `IT` o `GB` y el identificador no encaja con la forma exigida (longitud, posiciones de letras y dígitos, o un carácter de control fuera de su alfabeto), ENTONCES el sistema DEBERÁ indicar `TAX_ID_INVALID_FORMAT`. SI la forma es correcta y el control no coincide (incluido un CIF con dígito donde su tipo exige letra o al revés), ENTONCES DEBERÁ indicar `TAX_ID_INVALID_CHECKSUM` junto con el `taxIdType` detectado. Cuando el error de formato lleva `reason` `ALL_ZEROS`, `FIRST_DIGIT` o `IT_OFFICE_CODE`, el tipo ya se ha detectado y la respuesta DEBERÁ incluir también ese `taxIdType`. Con `COUNTRY_PREFIX`, y con los errores de formato sin `reason`, no se incluye.
- RF12 · España: CUANDO el país es `ES`, el sistema DEBERÁ clasificar el identificador como DNI (8 dígitos + letra), NIE (`X`/`Y`/`Z` + 7 dígitos + letra) o CIF (letra de tipo + 7 dígitos + control) y comprobarlo con su algoritmo. No se rellena con ceros: un DNI de 7 dígitos o un NIE con 8 dígitos son `TAX_ID_INVALID_FORMAT`. Las letras de control fuera del alfabeto también son `TAX_ID_INVALID_FORMAT`: `I`, `Ñ`, `O` y `U` en DNI y NIE, y letras fuera de `JABCDEFGHI` en CIF.
- RF13 · Portugal: CUANDO el país es `PT`, el sistema DEBERÁ exigir un NIF/NIPC de 9 dígitos cuyo primer dígito no sea 0, con control módulo 11, y guardarlo como `PT_NIF`. SI el primer dígito es 0, ENTONCES DEBERÁ indicar `TAX_ID_INVALID_FORMAT` con `reason: "FIRST_DIGIT"` y `taxIdType: "PT_NIF"`.
- RF14 · Francia: CUANDO el país es `FR`, el sistema DEBERÁ exigir un SIREN de 9 dígitos que pase Luhn, y guardarlo como `FR_SIREN`.
- RF15 · Alemania: CUANDO el país es `DE`, el sistema DEBERÁ exigir la parte numérica del USt-IdNr, de 9 dígitos con el primero distinto de 0 y control ISO 7064 MOD 11,10, y guardarla como `DE_VAT`. SI el primer dígito es 0, ENTONCES DEBERÁ indicar `TAX_ID_INVALID_FORMAT` con `reason: "FIRST_DIGIT"` y `taxIdType: "DE_VAT"`.
- RF16 · Italia: CUANDO el país es `IT`, el sistema DEBERÁ exigir una Partita IVA de 11 dígitos con el código de oficina válido y el control correcto, y guardarla como `IT_PIVA`. SI el código de oficina no es válido, ENTONCES DEBERÁ indicar `TAX_ID_INVALID_FORMAT` con `reason: "IT_OFFICE_CODE"`.
- RF17 · Reino Unido: CUANDO el país es `GB`, el sistema DEBERÁ exigir un VAT de 9 dígitos que cumpla el módulo 97 o la variante 9755, y guardarlo como `GB_VAT`.
- RF18 · Solo ceros: SI en `ES`, `PT`, `FR`, `DE`, `IT` o `GB` la parte numérica del identificador está formada solo por ceros, ENTONCES el sistema DEBERÁ indicar `TAX_ID_INVALID_FORMAT` con `reason: "ALL_ZEROS"` y el `taxIdType` detectado (RF11), aunque el control sea algorítmicamente correcto.
- RF19 · Prefijo de país: SI en `ES`, `PT`, `FR`, `DE`, `IT` o `GB` el identificador normalizado empieza por el prefijo de ese país, ENTONCES el sistema DEBERÁ indicar `TAX_ID_INVALID_FORMAT` con `reason: "COUNTRY_PREFIX"` y un mensaje que pida introducirlo sin prefijo. El sistema no quita el prefijo por su cuenta.
- RF20 · Resto de países: CUANDO el país no es `ES`, `PT`, `FR`, `DE`, `IT` ni `GB`, el sistema DEBERÁ aceptar un identificador normalizado de 2 a 20 caracteres de A–Z y 0–9, sin algoritmo, y guardarlo con `taxIdType = OTHER`. El orden de comprobación es: vacío → `REQUIRED`; caracteres fuera de A–Z y 0–9 → `TAX_ID_INVALID_FORMAT`; longitud fuera de 2–20 → `INVALID_LENGTH`. La regla de ceros no se aplica.
- RF21 · Unicidad: SI ya existe un cliente con el mismo país y el mismo identificador fiscal normalizado, ENTONCES el sistema DEBERÁ responder 409 `CUSTOMER_ALREADY_EXISTS` sin crear un segundo registro, también ante dos altas simultáneas.

### Consulta y búsqueda
- RF22 · Cliente por id: CUANDO se pide `GET /customers/:id`, el sistema DEBERÁ devolver el cliente con 200. SI el `id` no es un entero decimal canónico entre 1 y 9 007 199 254 740 991 (sin ceros a la izquierda, signos, decimales ni exponentes), ENTONCES DEBERÁ responder 400 `VALIDATION_ERROR` con `INVALID_ID` en el campo `id`. SI el `id` es válido pero no existe, ENTONCES DEBERÁ responder 404 `CUSTOMER_NOT_FOUND`.
- RF23 · Búsqueda: CUANDO se pide el listado con `q`, el sistema DEBERÁ devolver los clientes que cumplan alguna de estas dos condiciones:
  - su nombre de empresa contiene `q`. Antes de comparar, `q` se recorta con trim, ambos textos se pasan a forma NFC y se convierten a minúsculas con la conversión simple de Unicode, carácter a carácter y sin case folding (`ß` no equivale a `ss`). Así `IBÉRICA` encuentra `Ibérica`, pero no se ignoran tildes (`iberica` no encuentra `Ibérica`);
  - su identificador normalizado contiene `q` normalizado según RF2 para `taxId`. SI `q` normalizado como identificador queda vacío, solo se busca por nombre.

  Los caracteres `%` y `_` se tratan como texto literal.
- RF24 · Listado y parámetros: CUANDO se pide el listado sin `q` o con `q` vacío tras el trim, el sistema DEBERÁ devolver todos los clientes. En ambos casos (con o sin `q`) se aplican estas reglas:
  - Orden por nombre de empresa con la colación del español:
    - sin distinguir mayúsculas ni tildes (`Á` se ordena con `A`);
    - `Ñ` es una letra propia que va después de `N`;
    - dos nombres iguales según esta regla (por ejemplo `acme` y `Acme`) se ordenan por `id` ascendente, de modo que el orden siempre es determinista.
  - Máximo de 50 resultados: son los 50 primeros según ese orden, y `total` cuenta todas las coincidencias.
  - SI `q` supera 100 code points tras el trim, ENTONCES DEBERÁ responder 400 `VALIDATION_ERROR` con `INVALID_LENGTH` en `q`.
  - SI `q` aparece más de una vez o llega como array u objeto (`q[]=a`, `q[a]=b`), ENTONCES DEBERÁ responder 400 `VALIDATION_ERROR` con `INVALID_TYPE` en `q`.
  - Los parámetros desconocidos se ignoran. A diferencia del cuerpo del alta, la consulta no persiste nada, y tolerarlos evita romper a clientes que añaden parámetros de caché.
- RF25 · Sin resultados: MIENTRAS no haya clientes que cumplan la búsqueda, el sistema DEBERÁ responder 200 con `items: []` y `total: 0`, nunca 404.

### Errores de transporte y persistencia
Todos los errores se mantienen dentro de 400, 404, 409 y 500 (constitución, principio 8). El orden de comprobación es este: primero la ruta y el método (RF30, 404), después el transporte (RF26 a RF29, en ese orden) y por último los campos.
- RF26 · Content-Type: SI un `POST` llega sin `Content-Type: application/json` (se admite el parámetro `charset=utf-8`), ENTONCES el sistema DEBERÁ responder 400 `UNSUPPORTED_CONTENT_TYPE`.
- RF27 · Tamaño: SI el cuerpo supera 10 240 bytes, ENTONCES el sistema DEBERÁ responder 400 `PAYLOAD_TOO_LARGE` sin procesarlo.
- RF28 · JSON mal formado: SI el cuerpo no es JSON válido o está vacío, ENTONCES el sistema DEBERÁ responder 400 `MALFORMED_JSON`. El cuerpo se decodifica como UTF-8 estricto, sin sustituir nada por U+FFFD (RFC 8259 §8.1):
  - SI contiene cualquier secuencia UTF-8 no válida (por ejemplo, un byte 0xE9 suelto o un 0xC3 sin byte de continuación), ENTONCES DEBERÁ responder 400 `MALFORMED_JSON`;
  - SI empieza por el BOM (EF BB BF), ENTONCES también DEBERÁ responder 400 `MALFORMED_JSON`.
- RF29 · Cuerpo que no es objeto: SI el cuerpo es JSON válido pero no es un objeto (array, texto, número, booleano o `null`), ENTONCES el sistema DEBERÁ responder 400 `VALIDATION_ERROR` con `{ "field": "body", "code": "INVALID_TYPE" }`. Se usa este código y no `MALFORMED_JSON` porque la sintaxis es correcta y lo que falla es la estructura, igual que con un campo de tipo erróneo.
- RF30 · Ruta inexistente: SI se pide una ruta o un método no definidos (por ejemplo `GET /foo` o `DELETE /customers/1`), ENTONCES el sistema DEBERÁ responder 404 `NOT_FOUND` antes de comprobar Content-Type, tamaño o cuerpo. `OPTIONS` se considera un método no definido en todas las rutas. Hay una excepción explícita: CUANDO se pide `HEAD /customers` o `HEAD /customers/:id`, el sistema DEBERÁ responder igual que al `GET` equivalente (mismo estado y mismas cabeceras), pero sin cuerpo.
- RF31 · Error inesperado: SI ocurre un error inesperado, ENTONCES el sistema DEBERÁ responder 500 `INTERNAL_ERROR` con un mensaje genérico, sin exponer detalles internos, y sin dejar registros a medio guardar.
- RF32 · Persistencia: CUANDO se reinicia el servidor, el sistema DEBERÁ conservar los clientes guardados.

## Contrato de la API

Todas las respuestas de error siguen la constitución (principio 8): `{ "error": { "code", "message", "details?" } }`. Cada entrada de `details.fields` tiene `field`, `code` y `message`, y opcionalmente `taxIdType`, `reason` (`COUNTRY_PREFIX`, `ALL_ZEROS`, `FIRST_DIGIT` o `IT_OFFICE_CODE`) y `suggestion`.

### POST /customers
Request:
```json
{
  "companyName": "Acme Ibérica SL",
  "taxId": "b-1234567-4",
  "email": "  Compras@Acme.ES ",
  "country": "es",
  "plan": "growth"
}
```
201:
```json
{
  "id": 1,
  "companyName": "Acme Ibérica SL",
  "taxId": "B12345674",
  "taxIdType": "CIF",
  "email": "compras@acme.es",
  "country": "ES",
  "plan": "growth",
  "createdAt": "2026-11-12T10:00:00.000Z"
}
```
400 (varios campos; request con `"country": "GB"`, `"taxId": "GB980780684"` y un email no válido):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La petición contiene campos no válidos.",
    "details": {
      "fields": [
        { "field": "taxId", "code": "TAX_ID_INVALID_FORMAT", "reason": "COUNTRY_PREFIX", "message": "Introduce el identificador fiscal sin el prefijo GB." },
        { "field": "email", "code": "INVALID_EMAIL", "message": "El email no tiene un formato válido." }
      ]
    }
  }
}
```
400 (país `UK`):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "La petición contiene campos no válidos.", "details": { "fields": [ { "field": "country", "code": "INVALID_COUNTRY", "suggestion": "GB", "message": "¿Querías decir GB?" } ] } } }
```
409:
```json
{ "error": { "code": "CUSTOMER_ALREADY_EXISTS", "message": "Ya existe un cliente con ese identificador fiscal en ES.", "details": { "existingId": 1 } } }
```

### GET /customers?q=texto
200:
```json
{ "items": [ { "id": 1, "companyName": "Acme Ibérica SL", "taxId": "B12345674", "taxIdType": "CIF", "email": "compras@acme.es", "country": "ES", "plan": "growth", "createdAt": "2026-11-12T10:00:00.000Z" } ], "total": 1 }
```
`total` es el número total de coincidencias, aunque `items` se limite a 50.

### GET /customers/:id
200: el cliente con la misma forma que en el alta. 404: `{ "error": { "code": "CUSTOMER_NOT_FOUND", "message": "No existe el cliente 99." } }`.

### Códigos de error
| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Campos o parámetros no válidos (RF3–RF8, RF10–RF20, RF22, RF24, RF29). Códigos de campo: `REQUIRED`, `INVALID_TYPE`, `UNKNOWN_FIELD`, `INVALID_LENGTH`, `INVALID_CHARACTERS`, `INVALID_EMAIL`, `INVALID_COUNTRY`, `INVALID_PLAN`, `INVALID_ID`, `TAX_ID_INVALID_FORMAT`, `TAX_ID_INVALID_CHECKSUM` |
| 400 | `UNSUPPORTED_CONTENT_TYPE` | `POST` sin `application/json` (RF26) |
| 400 | `PAYLOAD_TOO_LARGE` | Cuerpo de más de 10 240 bytes (RF27) |
| 400 | `MALFORMED_JSON` | Cuerpo vacío o que no es JSON (RF28) |
| 404 | `CUSTOMER_NOT_FOUND` | `id` válido inexistente (RF22) |
| 404 | `NOT_FOUND` | Ruta o método no definidos (RF30) |
| 409 | `CUSTOMER_ALREADY_EXISTS` | Mismo país e identificador normalizado (RF21) |
| 500 | `INTERNAL_ERROR` | Error inesperado (RF31) |

## Datos persistidos (cliente)
| Campo | Regla |
|---|---|
| `id` | Entero autoincremental, asignado por el sistema |
| `companyName` | Texto obligatorio, NFC, 2–120 code points, sin espacios en los extremos ni caracteres de control |
| `taxId` | Texto obligatorio, siempre normalizado y sin prefijo de país |
| `taxIdType` | `DNI`, `NIE`, `CIF`, `PT_NIF`, `FR_SIREN`, `DE_VAT`, `IT_PIVA`, `GB_VAT` u `OTHER` |
| `email` | Texto obligatorio, en minúsculas, máximo 254 caracteres |
| `country` | Código ISO 3166-1 alfa-2 en mayúsculas (coherente con la tabla de IVA de D5) |
| `plan` | `starter`, `growth` o `enterprise` (informativo) |
| `createdAt` | Fecha y hora UTC en ISO 8601, asignada por el sistema |

Restricción: la pareja (`country`, `taxId`) es única. Los datos se guardan siempre ya normalizados, nunca tal como llegan.

## Casos límite (entrada → salida esperada)
Salvo que se indique otra cosa, un 400 es `VALIDATION_ERROR` en el campo `taxId` con el código indicado. Según RF11, las filas con `reason` `ALL_ZEROS`, `FIRST_DIGIT` o `IT_OFFICE_CODE` llevan además el `taxIdType` detectado: `DNI`, `NIE` o `CIF` en ES, y el tipo del país en PT, FR, DE, IT y GB.

### Identificador fiscal con país `ES`
| Entrada `taxId` | Salida |
|---|---|
| `12345678Z` | 201, `DNI` (12345678 mod 23 = 14 → Z) |
| `12345678z`, ` 12.345.678-Z `, `12 345 678–Z` (U+2013), `12345678\tZ`, `12345678` + U+00A0 + `Z`, `12345678Z\r\n` | 201, guardado como `12345678Z` |
| `12345678A` | 400 `TAX_ID_INVALID_CHECKSUM`, `DNI` |
| `00000023T` | 201, `DNI` (23 mod 23 = 0 → T) |
| `00000022E` | 201, `DNI` (22 mod 23 = 22 → E, última letra del alfabeto) |
| `00000000T` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` |
| `01234567L` / `1234567L` (7 dígitos) | 201 `DNI` (1234567 mod 23 = 19 → L) / 400 `TAX_ID_INVALID_FORMAT` (sin relleno) |
| `123456789Z` (9 dígitos), `12345678` (sin letra) | 400 `TAX_ID_INVALID_FORMAT` |
| `12345678U`, `12345678I`, `12345678O` | 400 `TAX_ID_INVALID_FORMAT` (letra fuera del alfabeto de control) |
| `12345678Ñ`, `12345678ß`, `12345678_Z`, `12345678/Z` | 400 `TAX_ID_INVALID_FORMAT` |
| `X1234567L` | 201, `NIE` (01234567 mod 23 = 19 → L) |
| `Y1234567X` | 201, `NIE` (11234567 mod 23 = 10 → X) |
| `Z1234567R` | 201, `NIE` (21234567 mod 23 = 1 → R) |
| `X1234567A` | 400 `TAX_ID_INVALID_CHECKSUM`, `NIE` |
| `X12345678L` (NIE antiguo, 8 dígitos) | 400 `TAX_ID_INVALID_FORMAT` (sin conversión) |
| `X0000000T` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS`, `NIE` (el control T sería correcto) |
| `Y0000000Z` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS`, `NIE`. Nota: el número usado en el cálculo es 10000000 (mod 23 = 14 → Z, control correcto), pero la parte numérica, es decir los 7 dígitos, es solo ceros |
| `W1234567D` / `W12345674` | 201 `CIF` / 400 `TAX_ID_INVALID_CHECKSUM` (tipo W exige letra) |
| `B12345674` | 201, `CIF` (A = 12, B = 14, D = 4) |
| `B1234567D` | 400 `TAX_ID_INVALID_CHECKSUM`, `CIF` (tipo B exige dígito) |
| `B1234567K` | 400 `TAX_ID_INVALID_FORMAT` (K no está en `JABCDEFGHI`) |
| `Q1234567D` / `Q12345674` | 201 `CIF` / 400 `TAX_ID_INVALID_CHECKSUM` (tipo Q exige letra) |
| `G12345674` y `G1234567D` | 201, `CIF` (tipo G admite ambos) |
| `B12345675` | 400 `TAX_ID_INVALID_CHECKSUM`, `CIF` |
| `A58818501` | 201, `CIF` (A = 14, B = 15, D = 1) |
| `B00000190` / `Q0000019J` | 201, `CIF` (A = 1, B = 9, D = 0 → dígito 0 o letra J) |
| `B00000000` / `Q0000000J` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` |
| `I1234567A`, `O1234567A` (tipo inexistente) | 400 `TAX_ID_INVALID_FORMAT` |
| `K1234567L`, `L…`, `M…` (NIF especiales) | 400 `TAX_ID_INVALID_FORMAT` (fuera de alcance) |
| `ES12345678Z`, `ESB12345674` | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |
| `""`, `"   "`, `"-.-"`, `null` | 400 `REQUIRED` |
| `12345678` como número | 400 `INVALID_TYPE` |
| `12345678Z\n-` | 400 `TAX_ID_INVALID_FORMAT`. El trim no quita el `\n` porque no está en un extremo; al eliminar el `-`, el `\n` queda al final, pero la normalización se aplica una sola vez |
| `12345678Z` con `country` = `es` o ` ES ` | 201, país guardado como `ES` y validación española aplicada |

### Identificador fiscal con país `PT` (NIF/NIPC, módulo 11)
| Entrada `taxId` | Salida |
|---|---|
| `501964843` | 201, `PT_NIF` (S = 184, 184 mod 11 = 8, control 3) |
| `501964842` | 400 `TAX_ID_INVALID_CHECKSUM`, `PT_NIF` |
| `123456789` | 201, `PT_NIF` (S = 156, mod 11 = 2, control 9) |
| `500000000` | 201, `PT_NIF` (S = 45, mod 11 = 1 → 10 → control 0) |
| `500000050` | 201, `PT_NIF` (S = 55, mod 11 = 0 → 11 → control 0) |
| `012345678` (empieza por 0) | 400 `TAX_ID_INVALID_FORMAT`, `FIRST_DIGIT`, `PT_NIF` |
| `000000000` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` (la regla de ceros va antes que la del primer dígito) |
| `50196484` (8) / `5019648430` (10) | 400 `TAX_ID_INVALID_FORMAT` |
| `PT501964843` | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |
| `501 964 843` | 201, guardado como `501964843` |

### Identificador fiscal con país `FR` (SIREN, Luhn)
| Entrada `taxId` | Salida |
|---|---|
| `732829320` | 201, `FR_SIREN` (suma Luhn 40; control 0) |
| `732829321` | 400 `TAX_ID_INVALID_CHECKSUM`, `FR_SIREN` (suma 41) |
| `552100554` | 201, `FR_SIREN` (suma Luhn 20) |
| `000000000` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` (suma 0, Luhn correcto) |
| `73282932` (8) | 400 `TAX_ID_INVALID_FORMAT` |
| `73282932000017` (SIRET, 14) | 400 `TAX_ID_INVALID_FORMAT` (solo SIREN) |
| `FR732829320` / `FR44732829320` (TVA) | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |
| `12345678A` | 400 `TAX_ID_INVALID_FORMAT` |

### Identificador fiscal con país `DE` (USt-IdNr, ISO 7064 MOD 11,10)
| Entrada `taxId` | Salida |
|---|---|
| `136695976` | 201, `DE_VAT` (P final = 5, control 11 − 5 = 6) |
| `136695977` | 400 `TAX_ID_INVALID_CHECKSUM`, `DE_VAT` |
| `123456788` | 201, `DE_VAT` (P final = 3, control 8) |
| `123456789` | 400 `TAX_ID_INVALID_CHECKSUM`, `DE_VAT` |
| `123456770` | 201, `DE_VAT` (P final = 1 → 10 → control 0) |
| `036695976` (empieza por 0) | 400 `TAX_ID_INVALID_FORMAT`, `FIRST_DIGIT`, `DE_VAT` |
| `000000000` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` |
| `13669597` (8) | 400 `TAX_ID_INVALID_FORMAT` |
| `DE136695976` | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |

### Identificador fiscal con país `IT` (Partita IVA)
Con la matrícula `1234567` (X parcial = 16, Y parcial = 15), el control es (10 − ((31 + d9 + f(d8) + f(d10)) mod 10)) mod 10, donde f(d) es el doble de d restando 9 si supera 9.
| Entrada `taxId` | Oficina | Salida |
|---|---|---|
| `00743110157` | 015 | 201, `IT_PIVA` (X = 12, Y = 11, control 7) |
| `00743110158` | 015 | 400 `TAX_ID_INVALID_CHECKSUM`, `IT_PIVA` |
| `12345670017` | 001 | 201 (X + Y = 33, control 7) |
| `12345670018` | 001 | 400 `TAX_ID_INVALID_CHECKSUM`, `IT_PIVA` |
| `12345670090` | 009 | 201 (X + Y = 40, control 0) |
| `12345671007` | 100 | 201 (33, control 7) |
| `12345671015` | 101 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 5 correcto) |
| `12345671016` | 101 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE`, `IT_PIVA`: con la oficina y el control erróneos, gana la oficina (RF10, paso 5 antes que el 6) |
| `12345671197` | 119 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 7 correcto) |
| `12345671205` | 120 | 201 (35, control 5) |
| `12345671213` | 121 | 201 (37, control 3) |
| `12345671221` | 122 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 1 correcto) |
| `12345678879` | 887 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 9 correcto) |
| `12345678887` | 888 | 201 (53, control 7) |
| `12345678903` | 890 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 3 correcto) |
| `12345679992` | 999 | 201 (58, control 2) |
| `12345670009` | 000 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 9 correcto) |
| `19000000000` | 000 | 400 `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE` (control 0 correcto) |
| `00000000000` | 000 | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` (los ceros van antes que la oficina) |
| `0074311015` (10) / `007431101570` (12) | — | 400 `TAX_ID_INVALID_FORMAT` |
| `IT00743110157` | — | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |

### Identificador fiscal con país `GB` (VAT, módulo 97 y 9755)
| Entrada `taxId` | Salida |
|---|---|
| `980780684` | 201, `GB_VAT` (S = 207, 207 + 84 = 291 = 3 · 97) |
| `980780629` | 201, `GB_VAT` (variante 9755: 207 + 55 + 29 = 291) |
| `980780685` | 400 `TAX_ID_INVALID_CHECKSUM`, `GB_VAT` (292 y 347 no son múltiplos de 97) |
| `123456782` | 201, `GB_VAT` (S = 112, 112 + 82 = 194 = 2 · 97) |
| `123456727` | 201, `GB_VAT` (variante 9755: 112 + 55 + 27 = 194) |
| `980 7806 84` | 201, guardado como `980780684` |
| `000000000` | 400 `TAX_ID_INVALID_FORMAT`, `ALL_ZEROS` (S + C = 0, módulo 97 correcto) |
| `980780684000` (sucursal, 12) | 400 `TAX_ID_INVALID_FORMAT` (solo 9 dígitos) |
| `GB980780684` | 400 `TAX_ID_INVALID_FORMAT`, `COUNTRY_PREFIX` |

### Resto de países (genérico)
| Entrada | Salida |
|---|---|
| `US`, `12-3456789` | 201, `OTHER`, guardado como `123456789` |
| `US`, `000000000` | 201, `OTHER` (la regla de ceros no aplica) |
| `US`, `A` / 2 caracteres / 20 / 21 | 400 `INVALID_LENGTH` / 201 / 201 / 400 `INVALID_LENGTH` |
| `US`, `A_` / 21 caracteres con `_` | 400 `TAX_ID_INVALID_FORMAT` (el formato va antes que la longitud) |
| `US`, `ß123`, `MX`, `ABC_123` | 400 `TAX_ID_INVALID_FORMAT` |
| `US`, `-` o `" . "` | 400 `REQUIRED` (vacío tras normalizar) |
| `US`, `-\n-` | 400 `TAX_ID_INVALID_FORMAT`: tras normalizar queda `\n`, que no está vacío pero no es A–Z ni 0–9 |

### País y relación con el tax ID
| Entrada | Salida |
|---|---|
| `country` = `""`, `"   "` o `null` | 400 `REQUIRED` en `country` |
| `country` = `XX`, `ESP`, `E`, `EU`, `EL`, `XK` | 400 `INVALID_COUNTRY` en `country` |
| `country` = `UK` | 400 `INVALID_COUNTRY`, `suggestion: "GB"`, mensaje "¿Querías decir GB?" |
| `country` = `XX`, `taxId` = `12345678A` | 400 con un único error, `INVALID_COUNTRY`; el `taxId` no se valida (RF8) |
| `country` = `XX`, sin `taxId` | 400 con dos errores: `INVALID_COUNTRY` y `REQUIRED` en `taxId` |
| `country` = `XX`, `taxId` = `123` (número) | 400 con dos errores: `INVALID_COUNTRY` e `INVALID_TYPE` en `taxId` |
| `980780684` en `GB` y en `US` | Ambos 201 (unicidad por país) |
| Alta de A (id 1), alta de B (id 2) y repetición de B | La tercera: 409, `details.existingId` = 2 |
| Alta de `12345678Z` en `ES` dos veces (o `12345678-z` tras `12345678Z`) | La segunda: 409 `CUSTOMER_ALREADY_EXISTS` |

### Otros campos y cuerpo de la petición
| Entrada | Salida |
|---|---|
| `plan` = `starter`, `growth`, `enterprise`, ` growth ` | 201 |
| `plan` = `Starter`, `pro` / `""`, `null` | 400 `INVALID_PLAN` / 400 `REQUIRED` en `plan` |
| `companyName` = `"A"` / 2 code points / 120 / 121 | 400 `INVALID_LENGTH` / 201 / 201 / 400 `INVALID_LENGTH` |
| `companyName` de 120 `é` en forma descompuesta (240 code points antes de NFC) | 201, 120 code points tras NFC |
| `companyName` con emoji (`Acme 😀`) | 201, el emoji cuenta como 1 code point |
| `companyName` = `"   "` o `null` | 400 `REQUIRED` |
| `companyName` = `"Acme\nIbérica"`, `"Acme\tIbérica"` | 400 `INVALID_CHARACTERS` |
| `email` = `ventas@acme`, `@acme.es`, `ventas acme@x.es`, `a@@b.es`, `a@b.`, `a@.es` | 400 `INVALID_EMAIL` |
| `email` = `ventas@acmé.es` (dominio no ASCII) | 400 `INVALID_EMAIL` |
| `email` de 254 / 255 code points | 201 / 400 `INVALID_LENGTH` |
| `email` = `Ventas@Acme.ES` | 201, guardado como `ventas@acme.es` |
| `email` = `"   "` o `null` | 400 `REQUIRED` |
| Campo extra `"discount": 10` | 400 `UNKNOWN_FIELD` en `discount` |
| Cuerpo `{` o cuerpo vacío | 400 `MALFORMED_JSON` |
| Cuerpo válido salvo un byte 0xE9 suelto dentro de `companyName` | 400 `MALFORMED_JSON` (UTF-8 no válido; no se guarda U+FFFD) |
| Cuerpo con un byte 0xC3 sin byte de continuación | 400 `MALFORMED_JSON` |
| Cuerpo válido que empieza por el BOM EF BB BF | 400 `MALFORMED_JSON` |
| Cuerpo con `Ibérica` codificado correctamente en UTF-8 (C3 A9) | Se procesa |
| Cuerpo `[]`, `"texto"`, `42`, `null` | 400 `VALIDATION_ERROR`, `INVALID_TYPE` en `body` |
| Cuerpo de 10 240 / 10 241 bytes | Se procesa / 400 `PAYLOAD_TOO_LARGE` |
| `Content-Type: text/plain` o ausente | 400 `UNSUPPORTED_CONTENT_TYPE` |
| `Content-Type: application/json; charset=utf-8` | Se procesa |
| `GET /foo`, `DELETE /customers/1`, `PUT /customers` | 404 `NOT_FOUND` |
| `POST /foo` con `Content-Type: text/plain` | 404 `NOT_FOUND` (la ruta se comprueba antes que el transporte) |
| `OPTIONS /customers`, `OPTIONS /customers/1` | 404 `NOT_FOUND` (método no definido, RF30) |
| `DELETE`, `PUT` o `POST /customers/%ZZ` | 404 `NOT_FOUND` (método no definido, RF30; no 500) |
| `POST /customers` con `Content-Encoding: gzip` y un cuerpo que no es gzip | 400 `MALFORMED_JSON` (RF28; no 500) |
| `HEAD /customers?q=acme` | 200, mismas cabeceras que `GET /customers?q=acme` y sin cuerpo (RF30) |
| `HEAD /customers/1` existente / `HEAD /customers/99` inexistente | 200 / 404, mismas cabeceras que el `GET` equivalente y sin cuerpo (RF30) |

### Búsqueda y consulta
| Entrada | Salida |
|---|---|
| `GET /customers?q=acme` con "Acme Ibérica SL" guardado | 200, lo incluye |
| `q=ACME`, `q=  acme  `, `q=IBÉRICA` | Lo incluyen |
| `q=Ibe` + U+0301 + `rica` (forma NFD) | Lo incluye (se normaliza a NFC antes de comparar) |
| `q=STRASSE` con "Straße GmbH" guardado | No lo incluye (sin case folding de ß a ss) |
| `q=iberica` | No lo incluye (no se ignoran tildes) |
| `q=12.345.678` | Encuentra `12345678Z` (se normaliza como identificador) |
| `q=-` con "Coca-Cola España SA" guardado | 200, lo encuentra solo por nombre (el identificador normalizado queda vacío) |
| `q=%` o `q=_` | Se tratan como texto literal, no como comodines |
| `q` sin coincidencias | 200, `{ "items": [], "total": 0 }` |
| `q` de 100 code points (con o sin espacios alrededor) / 101 tras el trim | 200 / 400 `INVALID_LENGTH` en `q` |
| `q=a&q=b`, `q[]=a`, `q[a]=b` | 400 `INVALID_TYPE` en `q` |
| `?foo=1` o `?q=acme&_=123` | Se ignora el parámetro desconocido |
| 51 coincidencias | 200, 50 en `items`, `total` = 51 |
| "Bravo" (id 1), "Álvarez" (id 2) | Orden: `Álvarez`, `Bravo` (Á se ordena con A) |
| "Ñandú" (id 1), "Nube" (id 2), "Nzeta" (id 3), "Oasis" (id 4) | Orden: `Nube`, `Nzeta`, `Ñandú`, `Oasis` (Ñ después de N) |
| "beta" (id 1), "Acme" (id 3), "acme" (id 2), "Ábaco" (id 4) | Orden: `Ábaco` (4), `acme` (2), `Acme` (3), `beta` (1) (acme y Acme empatan; desempate por id) |
| "Ácme" (id 1), "acme" (id 2) | Orden: `Ácme` (1), `acme` (2): empatan porque solo difieren en la tilde, y se desempata por id |
| 51 coincidencias, la última según la colación es "Zeta" | `items` trae las 50 primeras según la colación (sin "Zeta") y `total` = 51 |
| `GET /customers/1` existente / `/99` inexistente | 200 / 404 `CUSTOMER_NOT_FOUND` |
| `/abc`, `/0`, `/-1`, `/01`, `/1.5`, `/1e3`, `/9007199254740992` | 400 `INVALID_ID` en `id` |
| `/%ZZ`, `/%` (codificación porcentual no válida) | 400 `INVALID_ID` en `id` |
| `/9007199254740991` inexistente | 404 `CUSTOMER_NOT_FOUND` |

### Casos límite obligatorios que no aplican aquí
- Límites de tramo (0, 1, 10, 11, 50, 51): no aplican; se cubren en 002-tiered-pricing.
- Divisas no disponibles: no aplican; 004-currency.
- Redondeo del IVA: no aplica; 002/003. Esta spec solo garantiza que `country` sea un código válido para consultar la tabla de IVA (D5).

## Criterios de aceptación
- CA1: Cada fila de las tablas de casos límite tiene un test automatizado que la reproduce y pasa.
- CA2: Los nueve validadores (DNI, NIE, CIF, PT_NIF, FR_SIREN, DE_VAT, IT_PIVA, GB_VAT y genérico) se prueban de forma aislada, sin servidor ni base de datos. Cada uno con al menos un caso válido, uno con control erróneo y uno con formato erróneo. También se cubren los casos frontera:
  - control 0 en PT, DE, IT, FR y CIF;
  - reglas de dígito y letra del CIF;
  - módulo 97 y 9755 en GB;
  - solo ceros;
  - prefijo de país;
  - los límites del código de oficina de IT.
- CA3: Los mismos validadores se pueden ejecutar fuera del servidor, y para las mismas entradas devuelven el mismo resultado que la API (RF9).
- CA4: Un alta válida seguida de `GET /customers/:id` devuelve exactamente los datos normalizados, y siguen ahí tras reiniciar el servidor.
- CA5: Ninguna petición rechazada (400 o 409) deja registros nuevos en la base de datos.
- CA6: Todas las respuestas de error tienen la forma `{ error: { code, message, details? } }`, usan solo los códigos de la tabla de códigos de error y solo los estados 400, 404, 409 y 500.
- CA7: Con el repositorio recién clonado (solo `shared/` y `backend/`), `npm install`, `npm test` y `npm run lint` terminan sin errores, y `npm run dev` levanta el backend con la API.

## Supuestos
- S1: *Confirmado por el usuario.* Esta spec incluye el andamiaje mínimo del monorepo (workspaces, configuración de TypeScript estricto, tests y lint) con solo `shared/` y `backend/`. `frontend/` se crea en la 005.
- S2: *Confirmado por el usuario.* El prefijo de IVA intracomunitario se rechaza en vez de quitarse (RF19), para que el valor guardado sea único y comparable.
- S3: *Confirmado por el usuario.* No se valida que el email exista ni se exige unicidad de email: varias empresas pueden compartir contacto.
- S4: *Incorporado a RF2 y RF4 (hallazgos de QA).*
- S5: *Incorporado a RF23 (hallazgos de QA).*
- S6: *Confirmado por el usuario.* PT usa el NIF/NIPC; solo se exige que el primer dígito no sea 0.
- S7: *Confirmado por el usuario.* FR usa solo el SIREN.
- S8: *Confirmado por el usuario.* DE usa solo la parte numérica del USt-IdNr.
- S9: *Confirmado por el usuario.* IT valida también el código de oficina (RF16).
- S10: *Confirmado por el usuario.* GB usa el VAT de 9 dígitos con módulo 97 o 9755. No se comprueban los rangos de bloque de HMRC.
- S11: *Confirmado por el usuario.* Se rechazan los identificadores con la parte numérica solo de ceros (RF18).

## Fuera de alcance
- Editar y borrar clientes.
- NIF especiales `K`, `L` y `M` (ES).
- SIRET y número de TVA (FR); Steuernummer (DE); Codice Fiscale de personas físicas (IT); VAT de sucursal de 12 dígitos y formatos `GD`/`HA` (GB).
- Rangos del primer dígito en PT y rangos de bloque en GB.
- Validación algorítmica en países distintos de ES, PT, FR, DE, IT y GB.
- Comprobar en registros oficiales (AEAT, VIES, HMRC) que el identificador existe.
- Autenticación, permisos y auditoría de cambios.
- Paginación más allá del máximo de 50 resultados.
- Búsqueda que ignore tildes (el orden sí sigue la colación del español, RF24).
- Crear `frontend/` (spec 005).
- Interfaz del buscador y del formulario de alta (spec 005), aunque reutilizará los validadores (RF9).
- Cualquier efecto del plan en el precio: el plan es solo informativo y no interviene en el cálculo de tramos ni del IVA (D4, spec 002).

## Preguntas abiertas
Ninguna.
