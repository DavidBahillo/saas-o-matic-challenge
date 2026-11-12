# 001 · Tareas
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

Reglas para todas las tareas:
- TDD: primero los tests en rojo, después el código.
- Al terminar, `npm test` y `npm run lint` deben quedar en verde.
- Ningún archivo de más de 200 líneas ni función de más de 40, y nada de `any`.
- Los casos de los tests salen **fila a fila** de las tablas de la spec.

- [x] T1 · Andamiaje del monorepo — RF: CA7 — Archivos: `package.json` raíz (workspaces `shared` y `backend`; scripts `dev`, `test` y `lint`; `engines` node ≥ 22), `tsconfig.base.json`, `eslint.config.js` (reglas de plan §8), `vitest.config.ts`, `.gitignore` (+ `backend/data/`), `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`, `shared/src/sanity.test.ts`, `backend/package.json`, `backend/tsconfig.json`, `backend/src/server.ts` (Express 5 que escucha en `PORT`), `backend/test/sanity.test.ts`. Instala las dependencias del plan §2. Uno de los tests triviales debe importar desde `@saas-o-matic/shared`, para demostrar que el workspace resuelve. — Hecho cuando: `npm install`, `npm test` (2 tests en verde) y `npm run lint` terminan sin errores, `npm run dev` arranca el backend y ESLint falla si se añade un `any` de prueba.

- [x] T2 · Tipos compartidos y utilidades de texto y normalización — RF: RF2, RF9, RF23 (clave) — Archivos: `shared/src/customers/types.ts`, `plans.ts`, `field-result.ts`, `shared/src/taxid/result.ts`, `digits.ts`, `normalize-tax-id.ts`, `shared/src/text/whitespace.ts`, `code-points.ts`, `search-key.ts` y sus `*.test.ts`. Los tests cubren:
  - la normalización del tax ID: `\r\n`, U+00A0, U+202F, guiones U+2010 a U+2014 y U+2212, puntos, mayúsculas solo de a–z, y `ß` y `ñ` intactas;
  - el trim con la definición del Glosario;
  - `codePointLength` (emoji = 1);
  - `hasControlChars`;
  - `toSearchKey`: NFD de `Ibérica`, `IBÉRICA`, `Straße` sin pasar a `ss` y `İ` → `i`.

  — Hecho cuando: todos los tests anteriores pasan y `shared/src/index.ts` exporta los tipos y las funciones.

- [x] T3 · Validadores de España: DNI, NIE y CIF — RF: RF10, RF11, RF12, RF18 — Archivos: `shared/src/taxid/es-dni-nie.ts`, `es-cif.ts`, `es.ts` y `es-dni-nie.test.ts`, `es-cif.test.ts`, `es.test.ts`. — Hecho cuando: todas las filas de la tabla "Identificador fiscal con país ES" que no dependen del prefijo ni de `REQUIRED` pasan con su código, `reason` y `taxIdType` exactos. Entre ellas: `00000023T`, `1234567L`, `X12345678L`, `Y0000000Z`, `B00000190`, `Q0000019J`, `B1234567D` (CHECKSUM), `B1234567K` (FORMAT) y `W1234567D`.

- [x] T4 · Validadores de Portugal, Francia y Alemania — RF: RF10, RF11, RF13, RF14, RF15, RF18 — Archivos: `shared/src/taxid/pt-nif.ts`, `fr-siren.ts`, `de-vat.ts` y sus `*.test.ts`. — Hecho cuando: pasan todas las filas de las tablas PT, FR y DE de la spec, salvo las del prefijo, que van en la T5. Entre ellas: control 0 (`500000000`, `500000050`, `123456770`, `732829320`), `FIRST_DIGIT` con su `taxIdType` (`012345678` en PT y `036695976` en DE) y `ALL_ZEROS` antes que `FIRST_DIGIT` (`000000000` en PT).

- [x] T5 · Italia, Reino Unido, genérico y punto de entrada `validateTaxId` — RF: RF9, RF10, RF11, RF16, RF17, RF18, RF19, RF20 — Archivos: `shared/src/taxid/it-piva.ts`, `gb-vat.ts`, `generic.ts`, `validate-tax-id.ts` y sus `*.test.ts`. — Hecho cuando:
  - pasan todas las filas IT (incluida la tabla de oficinas), GB y "Resto de países";
  - `validate-tax-id.test.ts` cubre `REQUIRED` (`""`, `-.-`), `COUNTRY_PREFIX` sin `taxIdType` en los 6 países (`ESB12345674`, `PT501964843`, `FR44732829320`, `DE136695976`, `IT00743110157`, `GB980780684`), el despacho por país y `US` con `000000000` → `OTHER`.

- [x] T6 · País y resto de campos — RF: RF2, RF3, RF4, RF5, RF6, RF7, RF8 — Archivos: `shared/src/countries/iso3166-alpha2.ts`, `validate-country.ts`, `shared/src/customers/validate-company-name.ts`, `validate-email.ts`, `validate-plan.ts`, `validate-customer-input.ts` y sus `*.test.ts`. — Hecho cuando: pasan los tests de lista ISO (249 códigos, sin duplicados, sin UK, EU, EL ni XK) y de `UK` con `suggestion: "GB"`, y las filas de "País y relación con el tax ID" y "Otros campos". En `validate-customer-input` se comprueba además:
  - que se devuelven varios errores a la vez;
  - que `null` es `REQUIRED` y un campo de más es `UNKNOWN_FIELD`;
  - RF8 (`XX` + `12345678A` devuelve un único error);
  - que el valor devuelto es el `NewCustomer` normalizado.

- [x] T7 · Base de datos y repositorio — RF: RF21, RF23 (filtro), RF31 (atomicidad), RF32 — Archivos: `backend/src/config.ts`, `backend/src/db/connection.ts`, `backend/src/repositories/schema.ts`, `customer-row.ts`, `customers.repository.ts` y `customers.repository.test.ts`, `config.test.ts`. — Hecho cuando, con `:memory:`:
  - `migrate` es idempotente;
  - `insert` y `findById` devuelven el mismo `Customer`, y `findByCountryAndTaxId` funciona;
  - un duplicado (país, tax ID) lanza `DuplicateCustomerError`, pero el mismo tax ID en otro país se acepta;
  - `search` filtra por `company_name_search` y por `tax_id` con `instr`, con `%` y `_` como literales, y `config` aplica los valores por defecto y valida `PORT` y `DB_PATH`.

- [x] T8 · Infraestructura HTTP y `POST /customers` — RF: RF1, RF2, RF3, RF8, RF21, RF26, RF27, RF28, RF29, RF30, RF31 — Archivos: `backend/src/app.ts`, `backend/src/http/errors.ts`, `content-type.ts`, `json-body.ts`, `not-found.ts`, `error-handler.ts`, `backend/src/schemas/customer-body.schema.ts`, `backend/src/routes/customers.routes.ts`, `backend/src/controllers/customers.controller.ts`, `backend/src/services/customers.service.ts`, `backend/src/server.ts` (wiring), `backend/test/helpers/test-app.ts`, `backend/test/customers-create.int.test.ts`, `transport.int.test.ts`, `errors.int.test.ts` y `backend/src/http/content-type.test.ts`. — Hecho cuando los tests de integración comprueban:
  - el 201 con el ejemplo del contrato;
  - el 400 con varios campos;
  - el 409 con `existingId`;
  - `UNSUPPORTED_CONTENT_TYPE`, `PAYLOAD_TOO_LARGE` (10 240 se procesa y 10 241 no), `MALFORMED_JSON` (`{` y vacío) y `body` `INVALID_TYPE` (`[]`, `"texto"`, `42`, `null`);
  - el 404 `NOT_FOUND`, incluido `POST /foo` con `text/plain`;
  - el 500 genérico con un repositorio que lanza;
  - que en cada rechazo el recuento de filas no cambia (CA5).

- [x] T9 · `GET /customers/:id` y búsqueda con orden español — RF: RF22, RF23, RF24, RF25 — Archivos: `shared/src/search/sort-customers.ts` y `sort-customers.test.ts`, `backend/src/schemas/customer-query.schema.ts`, y ampliación de routes, controller y service, más `backend/test/customers-get.int.test.ts` y `customers-search.int.test.ts`. — Hecho cuando pasan todas las filas de "Búsqueda y consulta":
  - `INVALID_ID` (`/01`, `/1.5`, `/1e3`, `/9007199254740992`) y 404 en `/9007199254740991`;
  - `IBÉRICA` y la forma NFD encuentran Ibérica, `iberica` y `STRASSE` no encuentran nada, y `q=-` busca solo por nombre;
  - `q=a&q=b`, `q[]=a` y `q[a]=b` dan `INVALID_TYPE`;
  - 100 o 101 code points;
  - los órdenes Álvarez/Bravo, Nube/Nzeta/Ñandú/Oasis y acme/Acme por id;
  - 51 coincidencias, con 50 en `items` (sin "Zeta") y `total` 51.

- [x] T10 · Cierre: paridad, concurrencia, persistencia y comprobación final — RF: RF9, RF21, RF31, RF32 (CA3, CA4, CA6, CA7) — Archivos: `backend/test/customers-taxid.int.test.ts`, `customers-duplicates.int.test.ts` y `persistence.int.test.ts`. — Hecho cuando:
  - la API y `validateTaxId` dan el mismo resultado para al menos 2 filas por país (CA3);
  - dos POST iguales en paralelo dan exactamente un 201 y un 409, y queda 1 fila;
  - un cliente creado sobre un archivo temporal sigue ahí tras cerrar y reabrir la BD (CA4);
  - un test recorre todas las respuestas de error y comprueba su forma, sus códigos y sus estados (CA6);
  - `npm run dev` levanta la API y un `POST` real con curl devuelve 201 (CA7).

- [x] T11 · Correcciones de la validación final — RF: RF2, RF9, RF22, RF28, RF30, RF31 — Archivos: `shared/src/taxid/validate-tax-id.ts` (+ test), `shared/src/customers/validate-customer-input.ts` (+ test), `backend/src/http/json-body.ts`, `backend/src/http/error-handler.ts`, `backend/src/http/reject-options.ts` (nuevo), `backend/src/app.ts`, `backend/test/customers-taxid.int.test.ts`, `transport.int.test.ts` y `customers-get.int.test.ts`. Tests primero, en rojo; sin dependencias nuevas.
  1. **Normalización única del tax ID (RF2, RF9):** se separa `validateNormalizedTaxId(country, normalized)`. `validateTaxId(country, raw)` normaliza una sola vez y delega en ella, y la validación del campo en `validateCustomerInput` comprueba el tipo, normaliza una vez, devuelve `REQUIRED` si queda vacío y llama a `validateNormalizedTaxId`. — Hecho cuando: en `shared`, `ES` + `12345678Z\n-` da `TAX_ID_INVALID_FORMAT` y `US` + `-\n-` da `TAX_ID_INVALID_FORMAT`, y esas dos filas están también en la paridad de `customers-taxid.int`, con la API y `validateTaxId` coincidiendo.
  2. **OPTIONS y HEAD (RF30):** `rejectOptions`, montado antes del router, responde 404 `NOT_FOUND` a cualquier `OPTIONS`. — Hecho cuando: `OPTIONS /customers` y `OPTIONS /customers/1` dan 404 `NOT_FOUND`; `HEAD /customers?q=acme` da 200 y `HEAD /customers/1` y `/99` dan 200 y 404, con las mismas cabeceras que el GET equivalente (`content-type` y `content-length`) y sin cuerpo.
  3. **URIError en la ruta (RF22):** el `errorHandler` traduce el fallo de decodificación de parámetros en `/customers/:id` a 400 `VALIDATION_ERROR` con `INVALID_ID`. — Hecho cuando: `GET /customers/%ZZ` y `GET /customers/%` dan 400 `INVALID_ID`, no 500.
  4. **UTF-8 estricto (RF28):** `readJsonBody` usa `express.raw({ type: 'application/json', limit: 10240 })`, después `new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` y por último `JSON.parse`; un U+FEFF inicial da `MALFORMED_JSON`. — Hecho cuando: los cuerpos con 0xE9 suelto, con 0xC3 sin continuación y con BOM dan 400 `MALFORMED_JSON` sin crear filas; `Ibérica` en UTF-8 válido da 201; y siguen pasando los tests de 10 240/10 241 bytes, cuerpo vacío y `{`.
  5. **Sin `as` en `error-handler.ts` (línea 15) (RF31):** el tipo se estrecha con un type guard basado en `typeof` e `in`. — Hecho cuando: `backend/src/http/error-handler.ts` no contiene ningún `as`, `npm run lint` pasa y `errors.int` sigue en verde.
  6. **Revisión de cobertura (segundo informe; solo tests y helpers, salvo las filas añadidas a la spec):**
     - a. **B1, mensaje de RF19:** `backend/test/customers-create.int.test.ts:67` compara con el literal `"Introduce el identificador fiscal sin el prefijo GB."` y no con `countryPrefixMessage('GB')`, que lo hacía tautológico.
     - b. **IT, orden de RF10:** `it-piva.test.ts` incluye `12345671016` (oficina 101 y control erróneo) → `TAX_ID_INVALID_FORMAT`, `IT_OFFICE_CODE`, `IT_PIVA`. La fila ya está en la spec.
     - c. **CIF, los 17 tipos:** `es-cif.test.ts` tiene un `it.each` con la matrícula `1234567` (D = 4, letra D):
       - `A`, `B`, `E`, `H`: `…4` → válido y `…D` → `CHECKSUM`;
       - `N`, `P`, `Q`, `R`, `S`, `W`: `…D` → válido y `…4` → `CHECKSUM`;
       - `C`, `D`, `F`, `G`, `J`, `U`, `V`: `…4` y `…D` → válidos.
     - d. **`existingId` distinto de 1:** el test de duplicados crea A (id 1) y B (id 2), repite B y espera 409 con `existingId: 2`. La fila ya está en la spec.
     - e. **Empate solo por tilde:** "Ácme" (id 1) y "acme" (id 2) se ordenan `Ácme#1`, `acme#2`, tanto en `sort-customers.test.ts` como en `customers-search-order.int.test.ts`. La fila ya está en la spec.
     - f. **Paridad con resultado esperado:** `backend/test/helpers/taxid-cases.ts` incluye el `code`, `reason` y `taxIdType` esperados según la spec, al menos en todas las filas con `reason`, y `customers-taxid.int` los compara además de comprobar que la API y `validateTaxId` coinciden.
     - g. **Concurrencia:** un comentario en `customers-duplicates.int.test.ts` documenta la limitación: better-sqlite3 es síncrono y dentro de un proceso los dos POST se serializan, así que el test no prueba una carrera real. Se añade un test del service con un repositorio cuyo `findByCountryAndTaxId` devuelve `undefined` antes del insert, y que demuestra que el 409 sale de la constraint UNIQUE (`DuplicateCustomerError`) y no de una comprobación previa.
     - h. **DNI `00000022E`:** válido (22 mod 23 = 22 → E), en `es-dni-nie.test.ts`. La fila ya está en la spec.
     - i. **Helpers:**
       - `seed-customers`: el `taxIdType` sembrado es coherente con el identificador (un CIF no se siembra como `DNI`), y la secuencia de ids o nombres se pasa como parámetro o se crea por llamada, no como estado de módulo;
       - `raw-http`: el servidor se cierra también si hay error, en un `finally`;
       - `errors.int`: reutiliza `helpers/error-shape.ts` en vez de duplicar la comprobación de la forma del error.

     — Hecho cuando: todos los tests nuevos o modificados pasan y ninguno compara un valor consigo mismo.

  — Hecho cuando (global): todos los puntos anteriores cumplen su criterio y `npm test` y `npm run lint` quedan en verde.
