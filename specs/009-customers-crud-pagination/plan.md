# 009 · Plan técnico — Paginación, edición y borrado de clientes
Parte de `spec.md` (aprobada). Sin dependencias nuevas (ni runtime ni dev): se usan `<dialog>` nativo, `better-sqlite3`, Zod, TanStack Query y react-router ya presentes.

## 1. Resumen
- `shared/`: funciones puras de paginación y tipos (`CustomerList` con `page` y `pageSize`, `DeleteCustomerResult`).
- Backend: `GET /customers?q=&page=` paginado y normalizado en el servidor; `PUT /customers/:id`; `DELETE /customers/:id` con cascada atómica; migración idempotente de `simulations` a `ON DELETE CASCADE`.
- Frontend: paginación en la lista (URL `?q=&page=`), página `/customers/:id/edit` que reutiliza `CustomerForm`, diálogo de borrado, `RowActions` activo y avisos en región `aria-live`.
- Docs: `MEMORY.md` (D14, D16, estado) y notas de enmienda en las specs 003 y 008 (RF31).

## 2. Archivos por capa

### 2.1 `shared/`
- Nuevo `shared/src/pagination/pagination.ts` (+ `pagination.test.ts`), exportado desde `shared/src/index.ts`.
- `shared/src/customers/types.ts` (editar): `CustomerList` pasa a `{ items: Customer[]; total: number; page: number; pageSize: number }`; nuevo `DeleteCustomerResult { deletedSimulations: number }`.

Firmas puras (sin efectos, sin `any`):
```ts
export const PAGE_SIZE = 20;
/** Entero positivo canónico y seguro (/^[1-9]\d*$/ + Number.isSafeInteger); cualquier otra cosa (undefined, '', '0', '-1', '1.5', '007', '1e1', '+2', 'abc', array, desbordamiento) → 1. */
export function parsePageParam(raw: unknown): number;
/** Math.max(1, Math.ceil(total / pageSize)). */
export function lastPage(total: number, pageSize: number): number;
export interface PageSlice<T> { items: T[]; total: number; page: number; pageSize: number }
/** Recorta `page` a [1, lastPage] y devuelve la porción y la página efectiva (RF5). */
export function paginate<T>(all: readonly T[], requestedPage: number, pageSize: number): PageSlice<T>;
/** Rango 1-based visible; total 0 → { from: 0, to: 0 }. */
export function pageRange(page: number, pageSize: number, total: number): { from: number; to: number };
export type PageItem = number | 'gap-start' | 'gap-end';
/** Selector con elipsis: ≤ 7 páginas, todas; si no, 1, actual±1, última y 'gap-*'. Ej.: (15, 30) → [1,'gap-start',14,15,16,'gap-end',30]. */
export function pageWindow(page: number, last: number): PageItem[];
```

### 2.2 Base de datos (solo `backend/src/repositories/`)
- `simulations-ddl.ts` (editar): `REFERENCES customers(id) ON DELETE CASCADE` (bases nuevas nacen con cascada).
- Nuevo `rebuild-simulations.ts`: `rebuildSimulationsTable(db: Database.Database): void` (transacción: crear `simulations_new` con el DDL, copiar `SIMULATIONS_COLUMNS`, `DROP TABLE simulations`, `RENAME`, recrear índice). Se extrae de `simulations-currency-check.ts`, que pasa a usarlo (sin cambio de comportamiento; sus tests actuales lo garantizan).
- Nuevo `simulations-cascade-migration.ts` (+ test): `migrateSimulationsCascade(db): void`; lee `sqlite_master.sql` de `simulations` y, solo si contiene `ON DELETE RESTRICT`, llama a `rebuildSimulationsTable`. Idempotente.
- `schema.ts` (editar): `migrate` llama a `migrateSimulationsCascade(db)` tras `migrateSimulationCurrencyCheck`; se actualiza el comentario ("FK CASCADE").
- Sin cambios en `customers` (el UNIQUE `(country, tax_id)` ya cubre RF13, RF14 y RF15).

### 2.3 Backend
- `routes/customers.routes.ts`: `PUT /customers/:id` con `requireJsonContentType, ...readJsonBody` y `DELETE /customers/:id`, sin lógica. Se actualiza el comentario de cabecera (el transporte JSON ya no es solo de POST).
- `controllers/customers.controller.ts`: añade `update` y `remove`; `search` lee `q` y `page`.
- `schemas/customer-query.schema.ts`: añade `parseListQuery(query: unknown): ParseResult<{ q: string | undefined; page: number }>` (reutiliza `parseSearchQuery` y `parsePageParam`; `page` nunca da error: se normaliza).
- `schemas/customer-body.schema.ts`: sin cambios; `PUT` reutiliza `parseCreateCustomerBody` (mismo esquema estricto, `UNKNOWN_FIELD` primero). Orden en el controller: primero `id` (`INVALID_ID`), luego cuerpo.
- `services/customers.service.ts`:
  ```ts
  update(id: number, input: NewCustomer): Customer;          // 404 CUSTOMER_NOT_FOUND, 409 CUSTOMER_ALREADY_EXISTS
  remove(id: number): DeleteCustomerResult;                  // 404 CUSTOMER_NOT_FOUND
  search(q: string | undefined, page: number): CustomerList; // ordena con sortByNameEs y pagina con paginate
  ```
  Se elimina `SEARCH_MAX_RESULTS` (50). `update` recalcula `companyNameSearch` y atrapa `DuplicateCustomerError` → 409 con `existingId` (misma `toConflict`); si el cliente en conflicto ya no existe (borrado entre medias), reintenta el UPDATE una vez, y nunca deja un 500 por la carrera (RF15).
- `repositories/customers.repository.ts`:
  ```ts
  update(id: number, input: CustomerUpdate): Customer | undefined;   // CustomerUpdate = NewCustomer + companyNameSearch; undefined si no existe; lanza DuplicateCustomerError
  deleteWithSimulations(id: number): { deletedSimulations: number } | undefined; // undefined si no existe
  ```
  `update`: `UPDATE ... WHERE id = @id` y luego `SELECT` por id, dentro de una transacción (el `simulation_count` sale del `CUSTOMER_SELECT`). `deleteWithSimulations`: `db.transaction(...).immediate()` que cuenta las simulaciones y borra el cliente (la cascada borra las filas hijas; `PRAGMA foreign_keys = ON` ya está fijado en `db/connection.ts`); recuento y borrado en una sola transacción (RF21). Si `DELETE` cambia 0 filas → `undefined`.
- `http/errors.ts`: sin códigos nuevos (se usan `CUSTOMER_NOT_FOUND`, `CUSTOMER_ALREADY_EXISTS`, `INVALID_ID`).
- `app.ts`: sin cambios (el router ya está montado).

### 2.4 Frontend (`frontend/src/`)
- `api/schemas.ts`: `customerListSchema` con `page` y `pageSize`; nuevo `deleteResultSchema`.
- `api/query-keys.ts`: `customerList(q, page)` (`['customers','list',q,page]`); `customerListAll` sigue invalidando todas las páginas.
- `api/customers.queries.ts`: `useCustomers(q, page)` (añade `&page=N` solo si N > 1); nuevo `useCustomerForEdit(id)` con `refetchOnMount: 'always'`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false` (RF8: datos siempre del servidor y sin pisar lo que escribe el usuario).
- `api/customers.mutations.ts`: `useUpdateCustomer(id)` (`PUT`; `onSuccess` invalida `queryKeys.customers`, que cubre lista, detalle y simulaciones, RF12) y `useDeleteCustomer()` (`DELETE`; un 404 se resuelve como éxito con `{ deletedSimulations: 0, alreadyGone: true }`, RF25; `onSuccess` invalida las listas y elimina de la caché detalle y simulaciones del id).
- Nuevo `customers/list-url.ts`: `listUrl(q: string, page: number): string` (omite `page` si es 1 y `q` si está vacío).
- Nuevo `customers/Pagination.tsx`: `<nav aria-label="Paginación">` con enlaces "Anterior", "Siguiente" (con `aria-disabled` en los extremos) y números de `pageWindow` con `aria-current="page"`; el rango "Mostrando 21-40 de 230" usa `pageRange`. No se pinta con una página o ninguna.
- `customers/CustomersPage.tsx`: lee `page` con `parsePageParam`; pasa `(q, page)` a `useCustomers`; efecto que corrige la URL con `replace` si difiere de `listUrl(q, data.page)` (RF5, RF27); sustituye el texto "Mostrando N de M" por `Pagination`; guarda en estado el cliente a borrar y monta `DeleteCustomerDialog`; muestra el aviso de resultado (`LiveRegion` + banner visible). Si crece más de 200 líneas, el subcomponente de lista pasa a `CustomerListView.tsx`.
- `customers/RowActions.tsx` (reescrito): "Editar" es un `Link` con aspecto `btn--icon row-action` a `/customers/:id/edit` con `state: { from: '/?q=…&page=…' }`; "Borrar" es un `Button` que llama a `onDelete(customer)`. Se retiran el `Tooltip` "Próximamente" y `aria-disabled`. Nombres accesibles: "Editar {empresa}", "Borrar {empresa}".
- Nuevo `customers/DeleteCustomerDialog.tsx`: `<dialog>` nativo con `showModal()` (foco atrapado, Escape y fondo inerte nativos; clic en el fondo cierra; el foco vuelve al botón que lo abrió); título con el nombre, texto "Se borrarán también N simulaciones" / "No tiene simulaciones" (`simulationCount` de la fila, con `simulationsLabel` de `lib/pluralize.ts`), botones "Cancelar" (foco inicial, `autoFocus`) y "Borrar" (`variant="destructive"`); error con "Reintentar" y bloqueo del doble envío con `useSubmitLock`.
- `customers/CustomerForm.tsx` (editar): nuevas props `initialValues?`, `submitLabel`, `pendingLabel`, `cancelTo?`; sin `initialValues` se comporta como hoy ("Crear cliente"/"Creando…").
- Nuevo `customers/EditCustomerPage.tsx`: lee `:id`, usa `useCustomerForEdit`; muestra `Skeleton`, `NotFound` (404 o `INVALID_ID`) y `ErrorState` con reintento; con datos monta `<CustomerForm key={id} initialValues=… submitLabel="Guardar cambios" />`, con un latch (`useRef`) para no desmontar el formulario en refetches posteriores; al guardar navega a `state.from` (validado: empieza por `/` y no por `//`; si falta, `/`) con `state: { notice }`. Título del documento "Editar cliente".
- `App.tsx`: ruta `/customers/:id/edit` antes de `*`.
- `styles/`: nuevos `pagination.css` y `dialog.css` (importados en `main.tsx`), solo tokens de `DESIGN.md` (`--shadow-lg`, radio `md` de 12 px, `--color-error-strong`, `--color-border-control`); apilado y sin desbordar a 360 px. Si `design-tokens`/`design-spacing` enumeran archivos, se añaden.
- Tests existentes que cambian: `RowActions.test.tsx` (ya no "Próximamente"), `CustomersPage*.test.tsx`, `customers.queries.test.tsx`, `test/fixtures.ts` y `mock-fetch` (la lista lleva `page` y `pageSize`), `backend/test/error-catalog.int.test.ts` (la fila "método inexistente" usa `DELETE /customers/1`, que ahora existe: pasa a `PATCH`) y los tests de búsqueda con tope 50.

## 3. Contrato de la API

`GET /customers?q=ab&page=2` → 200
```json
{ "items": [ { "id": 41, "companyName": "Acme SL", "taxId": "12345678Z", "taxIdType": "DNI",
  "email": "ops@acme.es", "country": "ES", "plan": "growth", "createdAt": "2026-11-01T10:00:00.000Z",
  "simulationCount": 3 } ],
  "total": 21, "page": 2, "pageSize": 20 }
```
`page=007`, `1e1`, `+2`, `''`, `0`, `-1`, `abc`, `99999999999999999999` → `page: 1` en la respuesta; `page=999` con 3 páginas → `page: 3`. Nunca 400 por `page`. Un `q` inválido sigue dando 400 `VALIDATION_ERROR`.

`PUT /customers/41` (cuerpo completo) → 200 con el cliente actualizado (mismo formato que `GET`)
```json
{ "companyName": "Acme Iberia SL", "country": "ES", "taxId": " 12345678-z ", "email": "ops@acme.es", "plan": "enterprise" }
```
- Cuerpo con `id`, `createdAt`, `simulationCount` u otros → 400 `VALIDATION_ERROR` con `details.fields[0].code = "UNKNOWN_FIELD"`.
- Otro cliente con el mismo (país, NIF) → 409 `{ "error": { "code": "CUSTOMER_ALREADY_EXISTS", "message": "…", "details": { "existingId": 7 } } }`.
- `:id` no canónico (`0`, `-1`, `abc`, `007`) → 400 `INVALID_ID`; inexistente → 404 `CUSTOMER_NOT_FOUND`.

`DELETE /customers/41` → 200 `{ "deletedSimulations": 14 }`; inexistente → 404 `CUSTOMER_NOT_FOUND`; id no canónico → 400 `INVALID_ID`. Tras borrar: `GET /customers/41` y `GET /customers/41/simulations` → 404 `CUSTOMER_NOT_FOUND`; `GET /simulations/:id` de una suya → 404 `SIMULATION_NOT_FOUND`.

## 4. Decisiones (con la alternativa descartada)
- D-1 Paginación en memoria en el service (tras `sortByNameEs`) con `paginate` de `shared/`. *Descartado:* `LIMIT/OFFSET` en SQL, porque el orden con colación española (D11) se hace en memoria y SQLite no lo replica.
- D-2 La normalización de `page` vive en `shared/` (`parsePageParam`, `paginate`) y la usan backend y frontend: una sola fuente de verdad (principio 3). *Descartado:* duplicarla en el frontend.
- D-3 La respuesta lleva la `page` efectiva y la interfaz corrige la URL con `replace`. *Descartado:* 400 por `page` inválida (la spec pide normalizar).
- D-4 `PUT` con el mismo esquema del alta, sin comprobación previa de duplicado: el UNIQUE decide y `UPDATE` sobre el mismo (país, NIF) no viola nada, así que el propio cliente nunca es su duplicado (RF14) y la carrera da 409 (RF15). *Descartado:* "buscar y luego guardar" (carrera, causaría 500).
- D-5 Cascada con `ON DELETE CASCADE` y migración por reconstrucción de tabla; el recuento se toma dentro de la misma transacción `IMMEDIATE` que el `DELETE`. *Descartado:* borrar las simulaciones a mano en el repositorio (dos sentencias que se pueden desincronizar y no protegen a futuras rutas) y el borrado lógico (fuera de alcance).
- D-6 Helper común `rebuildSimulationsTable` en lugar de copiar la reconstrucción de la 007. *Descartado:* duplicar el SQL.
- D-7 Retorno tras editar con `location.state.from` (validado) y no con `?from=` en la URL: evita enlaces largos y redirecciones abiertas; sin estado (URL directa) cae a `/`. *Descartado:* `navigate(-1)` (no es fiable tras recargar).
- D-8 Diálogo con `<dialog>` nativo, sin librería (cero dependencias; foco, Escape e inercia gratis). *Descartado:* un modal propio con trampa de foco manual o una librería como Radix.
- D-9 El número del diálogo es el `simulationCount` de la fila, y el aviso final usa el `deletedSimulations` real (RF19, RF22). *Descartado:* una petición extra para contar antes de abrir.
- D-10 Edición: la caché se invalida entera (`['customers']`) tras guardar (lista, detalle y simulaciones), más simple que invalidar claves sueltas. *Descartado:* actualizar la caché a mano con `setQueryData`.
- D-11 Un 404 al borrar es éxito en la interfaz (RF25); el backend sigue respondiendo 404 (RF24).

## 5. Estrategia de tests (Vitest, tests primero)
- `shared`: `pagination.test.ts` — `parsePageParam` (todos los valores de la tabla de casos límite), `paginate` con 0, 1, 10, 11, 20, 21, 40, 41, 50, 51 clientes y página fuera de rango, `pageRange`, `pageWindow` (≤ 7, 30 páginas, extremos).
- Migración: BD "legada" en `:memory:` con el DDL RESTRICT, clientes y simulaciones; tras `migrate` conserva filas e ids, la FK es CASCADE, un segundo `migrate` no cambia nada (CA9) y `foreign_keys` sigue en 1. Los tests de `simulations-currency-check` y `simulations-migration` siguen pasando.
- Repositorio (SQLite en memoria): `update` (cambia, 404, duplicado → `DuplicateCustomerError`, mismo (país, NIF) no es duplicado), `deleteWithSimulations` (0, 1 y 14 simulaciones, id inexistente, atomicidad forzando un fallo con un trigger de prueba que aborta el `DELETE`).
- Servicio: `search` pagina y devuelve `page`/`pageSize`; `update` mapea 404 y 409 con `existingId`; reintento cuando el existente desaparece; `remove`.
- Integración HTTP (`backend/test/*.int.test.ts`, con helpers existentes): `GET` con todos los `page` raros, `q`+`page`, 21 coincidencias; `PUT` (válido, `UNKNOWN_FIELD`, 409, 404, `INVALID_ID`, cuerpo vacío o malformado, formato de NIF `12345678Z`/`12345678A`, NIE `X1234567L`/`X1234567A`, CIF `A58818501`/`A58818502`, `UK`, ES→PT, cambio de país con simulaciones que quedan intactas); `DELETE` (con y sin simulaciones, `deletedSimulations`, 404 posteriores de detalle, simulaciones y `GET /simulations/:id`, re-alta del mismo país + NIF); dos `PUT` concurrentes al mismo (país, NIF) → un 200 y un 409, nunca 500.
- Frontend (Testing Library + jsdom): `Pagination` (visibilidad, deshabilitados, elipsis, `aria-current`), `CustomersPage` (página en la URL, `page=1` omitido, corrección de URL, `q` reinicia, borrar la última de una página), `RowActions`, `DeleteCustomerDialog` (foco inicial en Cancelar, Escape y clic fuera, "No tiene simulaciones", error y reintento, 404 como éxito, `deletedSimulations` real en el aviso), `EditCustomerPage` (URL directa con datos del servidor, sin valores del alta, 404, `INVALID_ID`, error con reintento, 409 con enlace, `UNKNOWN_FIELD`, vuelta a `state.from`, invalidación de lista, detalle y simulaciones, sin doble envío), y los tests de estilos/tokens para los CSS nuevos. Si jsdom 29 no implementa `HTMLDialogElement.showModal/close`, `test/setup.ts` los simula (solo en tests).
- `npm test` y `npm run lint` en verde al cerrar cada tarea. Verificación manual en navegador a 360 px y escritorio, ambos temas, para CA10.

## 6. Cobertura de RF
| RF | Parte del plan |
|---|---|
| RF1, RF3, RF4, RF5 | `shared/pagination`, `parseListQuery`, `service.search`, `list-url`, `CustomersPage` |
| RF2, RF6 | `Pagination`, `pageWindow`, `pageRange`, estados de `CustomersPage` |
| RF7, RF8, RF9 | ruta `/customers/:id/edit`, `EditCustomerPage`, `useCustomerForEdit`, `CustomerForm` |
| RF10, RF13, RF14, RF15, RF17 | `PUT`, esquema compartido, `service.update`, `repository.update`, UNIQUE |
| RF11, RF12, RF16, RF18 | `useUpdateCustomer`, `state.from`, invalidación de `['customers']`, `useSubmitLock` |
| RF19, RF22, RF25, RF26 | `DeleteCustomerDialog`, `useDeleteCustomer` |
| RF20, RF21, RF24, RF29 | `DELETE`, `repository.deleteWithSimulations`, 404 en lecturas |
| RF23 | `simulations-ddl`, `rebuild-simulations`, `simulations-cascade-migration`, `schema.migrate` |
| RF27 | `CustomersPage` (corrección de URL, `NoCustomers`) |
| RF28 | UNIQUE + borrado físico (test de re-alta) |
| RF30 | `RowActions`, diálogo accesible, `LiveRegion`, CSS con tokens |
| RF31 | tarea de documentación |

## 7. Riesgos
- Reconstruir `simulations` con `AUTOINCREMENT` reinicia su contador en el máximo `id` existente: ids de simulaciones borradas al final pueden reutilizarse. Sin referencias externas, se acepta (misma situación que en la 007).
- Paginar en memoria no escala a cientos de miles de clientes; es una herramienta interna (D11) y se acepta.
- jsdom puede no implementar `<dialog>`; mitigado con un stub en `test/setup.ts`.
- `PUT` y `DELETE` pasan a existir: hay tests que asumían 404 para esos métodos (ver 2.4).
- Última escritura gana en ediciones simultáneas del mismo cliente (spec, fuera de alcance).
- Si `CustomersPage.tsx` supera 200 líneas, dividir antes de cerrar la tarea.
