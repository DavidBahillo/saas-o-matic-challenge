# 009 · Paginación, edición y borrado de clientes
Estado: aprobada

## Contexto y objetivo (por qué)
Hoy la lista de clientes muestra como mucho 50 y, si hay más, solo dice "Mostrando N de M" sin forma de ver el resto. Un cliente, una vez dado de alta, no se puede corregir (un NIF mal escrito, un correo que cambia, un cambio de plan) ni eliminar (un alta duplicada o de prueba). Los botones "Editar" y "Borrar" de la lista están deshabilitados con el aviso "Próximamente" (008, RF64 a RF67), que esta spec sustituye.

Objetivo: que el equipo comercial pueda (1) recorrer todos los clientes por páginas de 20, (2) editar un cliente con el mismo formulario del alta, con todos los datos ya cargados al pulsar "Editar", y (3) borrar un cliente con confirmación, eliminando también todas sus simulaciones.

Decisiones del usuario (incorporadas): 20 clientes por página; página inválida o fuera de rango se normaliza; "Editar" y "Borrar" solo en la lista; guardar sin cambios es un guardado normal y vuelve a la lista; se puede cambiar el país aunque haya simulaciones (las existentes quedan congeladas); confirmación con diálogo simple que avisa del número de simulaciones que se borrarán; borrado físico en cascada; campos ajenos rechazados con `UNKNOWN_FIELD`.

Esta spec ENMIENDA la decisión D14 (003): las simulaciones dejan de bloquear el borrado del cliente (antes `ON DELETE RESTRICT`, "descartado: borrado" y "sin paginación"). Las simulaciones siguen siendo inmutables mientras existan: solo desaparecen junto con su cliente. También enmienda 008 (RF64 a RF67, botones "Próximamente") y D16 (alcance "sin edición ni borrado").

Contexto vigente: unicidad por (país, identificador fiscal normalizado) con 409 y `existingId` (D9); validación oficial del identificador fiscal por país (D10, principio 4); listado con colación española y desempate por id (D11); errores `{ error: { code, message, details? } }` (principio 8).

## Contrato de la API (resumen)
- `GET /customers?q=&page=` → `{ items, total, page, pageSize }`: `total` es el de coincidencias, `pageSize` 20 y `page` la página efectiva (ya normalizada por el servidor).
- `PUT /customers/:id` con el cuerpo completo (nombre, país, identificador fiscal, correo, plan), validado con el mismo esquema estricto del alta; el primer error es `UNKNOWN_FIELD` si hay campos ajenos. Devuelve el cliente actualizado.
- `DELETE /customers/:id` → 200 `{ deletedSimulations: N }`.
- `GET /customers/:id` y las dos anteriores con `:id` no canónico → 400 `INVALID_ID`; inexistente → 404 `CUSTOMER_NOT_FOUND`.

## Requisitos funcionales (EARS)

### A) Paginación
- RF1: CUANDO se muestre la lista de clientes, el sistema DEBERÁ mostrarla en páginas de 20, conservando el orden actual (nombre con colación española, desempate por id), de modo que todos los clientes sean alcanzables.
- RF2: CUANDO la lista tenga más de una página, el sistema DEBERÁ mostrar "anterior", "siguiente" y un selector numérico de páginas con elipsis cuando haya muchas, la página actual indicada y el rango visible ("Mostrando 21-40 de 230"); DEBERÁ deshabilitar "anterior" en la primera página y "siguiente" en la última; con una sola página o ninguna NO DEBERÁ mostrar controles.
- RF3: CUANDO el usuario cambie de página, el sistema DEBERÁ reflejarla en la dirección de la página, de modo que recargar, volver atrás o compartir el enlace muestre la misma página; la página 1 DEBERÁ omitirse de la dirección.
- RF4: CUANDO el usuario escriba o cambie una búsqueda, el sistema DEBERÁ volver a la primera página; la paginación DEBERÁ aplicarse sobre las coincidencias; AL cargar una dirección con `?q` y `page`, DEBERÁ respetar `page` (solo se reinicia al cambiar `q`).
- RF5: SI `page` no es un entero positivo canónico (vacío, `0`, negativo, decimal, no numérico, con ceros a la izquierda como `007`, con exponente como `1e1`, con signo como `+2`, o que desborde un entero seguro), ENTONCES el servidor DEBERÁ usar la página 1; SI es un entero válido mayor que la última página, ENTONCES DEBERÁ usar la última; en ambos casos sin error, devolviendo en `page` la página efectiva, y la interfaz DEBERÁ corregir la dirección.
- RF6: MIENTRAS se carga otra página, el sistema DEBERÁ mostrar el estado de carga y, si falla, el estado de error con "Reintentar" (principio 8), sin perder la búsqueda activa.

### B) Edición
- RF7: CUANDO el usuario pulse "Editar" en una fila de la lista, el sistema DEBERÁ abrir la página de edición en una dirección propia por cliente (`/customers/:id/edit`) con el mismo formulario del alta, con título y botón adaptados ("Editar cliente", "Guardar cambios"). "Editar" y "Borrar" existen solo en la lista, no en el detalle.
- RF8: CUANDO se abra el formulario de edición, sea desde la lista, con una dirección directa o tras recargar, el sistema DEBERÁ obtener siempre los datos del cliente del servidor y mostrar ya cargados, sin acción del usuario, nombre de empresa, país, identificador fiscal, correo y plan; NO DEBERÁ aplicar los valores por defecto del alta (p. ej. el plan inicial).
- RF9: MIENTRAS se cargan los datos, el sistema DEBERÁ mostrar el estado de carga y no un formulario vacío; SI el cliente no existe, ENTONCES DEBERÁ mostrar "cliente no encontrado" (404 `CUSTOMER_NOT_FOUND`); SI el id no es canónico, ENTONCES 400 `INVALID_ID` con mensaje legible; SI la carga falla, ENTONCES DEBERÁ ofrecer "Reintentar".
- RF10: CUANDO el usuario guarde, el sistema DEBERÁ validar el cuerpo completo con exactamente las mismas reglas y mensajes que el alta (nombre, país ISO, identificador fiscal con su algoritmo por país, correo, plan) y mostrar los errores junto a su control; SI trae campos ajenos (`id`, `createdAt`, `simulationCount`, etc.), ENTONCES DEBERÁ rechazarlo con 400 `UNKNOWN_FIELD`, comprobado antes que el resto de errores.
- RF11: CUANDO la edición sea válida, el sistema DEBERÁ guardar los cambios, conservar el id y la fecha de alta, y volver a la lista a la MISMA búsqueda y página de la que se partió, aunque el cliente cambie de posición por el nuevo nombre; lista y detalle DEBERÁN mostrar los valores nuevos sin recargar a mano.
- RF12: CUANDO se cambie el país y se guarde, el sistema DEBERÁ refrescar la lista, el detalle y las simulaciones del cliente, NO DEBERÁ modificar ninguna simulación existente (importes, IVA, país de IVA, divisa y tipo congelados, principio 2) y las simulaciones nuevas DEBERÁN usar el país del cliente y su divisa asociada.
- RF13: SI el país y el identificador fiscal (normalizado) coinciden con los de OTRO cliente, ENTONCES el sistema DEBERÁ responder 409 `CUSTOMER_ALREADY_EXISTS` con su `existingId`, mostrar "Ver el cliente existente" y no guardar nada.
- RF14: CUANDO se guarde sin cambiar país ni identificador fiscal (o cambiándolo solo de formato: la normalización admite espacios, guiones, puntos y minúsculas), el sistema NO DEBERÁ considerarlo duplicado de sí mismo.
- RF15: SI dos ediciones simultáneas dejarían el mismo (país, identificador fiscal), ENTONCES la segunda DEBERÁ recibir 409 `CUSTOMER_ALREADY_EXISTS`, nunca un 500.
- RF16: CUANDO se guarde sin ningún cambio, el sistema DEBERÁ tratarlo como un guardado normal, sin error ni aviso, y volver a la lista.
- RF17: SI el cliente ya no existe al guardar, ENTONCES 404 `CUSTOMER_NOT_FOUND`, avisado en el formulario.
- RF18: MIENTRAS se envía la edición, el sistema DEBERÁ impedir un segundo envío.

### C) Borrado
- RF19: CUANDO el usuario pulse "Borrar" en una fila, el sistema DEBERÁ abrir un diálogo con el nombre de la empresa, el número de simulaciones que se borrarán (el `simulationCount` de la fila; "No tiene simulaciones" si es 0) y "Cancelar" y "Borrar"; el foco inicial DEBERÁ estar en "Cancelar"; Escape, clic fuera y "Cancelar" DEBERÁN cerrarlo sin borrar nada.
- RF20: CUANDO el usuario confirme, el sistema DEBERÁ eliminar físicamente el cliente y todas sus simulaciones (`DELETE /customers/:id` → 200 `{ deletedSimulations: N }`), cerrar el diálogo, actualizar lista y total y avisar del resultado.
- RF21: El sistema DEBERÁ aplicar el borrado y el recuento de simulaciones eliminadas en una sola operación atómica: SI falla cualquier parte, ENTONCES cliente y simulaciones DEBERÁN permanecer intactos.
- RF22: SI las simulaciones realmente borradas difieren del número del diálogo (p. ej. se creó una entre medias), ENTONCES el aviso final DEBERÁ informar del número real (`deletedSimulations`).
- RF23: CUANDO se actualice una base de datos existente, el sistema DEBERÁ migrar la tabla de simulaciones para que sus filas pasen a borrarse en cascada con su cliente, conservando todos los clientes y simulaciones existentes sin alterar ningún dato; la migración DEBERÁ ser idempotente (arrancar varias veces no la repite ni falla).
- RF24: SI el cliente no existe al confirmar, ENTONCES 404 `CUSTOMER_NOT_FOUND`; SI el id no es canónico, ENTONCES 400 `INVALID_ID`.
- RF25: SI un borrado falla por red y el reintento recibe 404 (porque el primero sí se aplicó), ENTONCES la interfaz DEBERÁ tratarlo como éxito y retirar el cliente de la lista.
- RF26: SI el borrado falla por error de red o interno, ENTONCES el cliente DEBERÁ seguir en la lista, el diálogo mostrar el error con "Reintentar" y, MIENTRAS se borra, no admitir una segunda confirmación.
- RF27: CUANDO se borre el último cliente de la página actual y existan páginas anteriores, el sistema DEBERÁ mostrar la anterior; si era el único resultado de una búsqueda, DEBERÁ mostrar "Sin resultados para «q»"; si era el último cliente, el estado vacío "Todavía no hay clientes".
- RF28: CUANDO se borre un cliente, el sistema DEBERÁ permitir dar de alta otro con el mismo país e identificador fiscal.
- RF29: CUANDO un cliente se haya borrado, el sistema DEBERÁ responder 404 `CUSTOMER_NOT_FOUND` al pedir su detalle o `GET /customers/:id/simulations`, y 404 `SIMULATION_NOT_FOUND` al pedir por id una de sus simulaciones.

### D) Interfaz y documentación
- RF30: CUANDO esta spec esté implementada, "Editar" y "Borrar" de la lista DEBERÁN estar activos, sin "Próximamente", con nombre accesible que incluya la empresa, operables con teclado, con diálogo accesible (foco dentro, foco devuelto al cerrar) y los avisos de resultado (guardado, borrado, errores) DEBERÁN anunciarse en una región `aria-live`; DEBERÁN seguir `DESIGN.md` (solo tokens, contraste AA, responsive desde 360 px, apilado en menos de 768 px).
- RF31: CUANDO se complete esta spec, `MEMORY.md` DEBERÁ actualizar D14 (borrado en cascada, fin de `ON DELETE RESTRICT`, nuevos endpoints) y D16 (alcance con edición y borrado), recoger el estado de la 009, retirar lo hecho de "Pendiente para otra spec" y seguir por debajo de 60 líneas; las specs 003 y 008 DEBERÁN llevar una nota de enmienda que remita a la 009.

## Casos límite (tabla entrada → salida esperada)
Tamaño de página 20.

| Entrada | Salida esperada |
|---|---|
| 0 clientes | Estado vacío "Todavía no hay clientes"; sin controles |
| 1, 10 y 11 clientes | Una página, sin controles |
| 20 clientes | Una página completa; sin controles |
| 21 clientes | Dos páginas: 20 y 1; "Mostrando 21-21 de 21" en la 2 |
| 40 y 41 clientes | 2 páginas; 3 páginas con 1 cliente en la tercera |
| 50 y 51 clientes | 3 páginas (20+20+10 y 20+20+11) |
| Muchas páginas (p. ej. 30) | Selector numérico con elipsis |
| Búsqueda con 0 coincidencias | "Sin resultados para «q»"; sin controles |
| Búsqueda con 21 coincidencias, página 2 | 1 resultado; total 21; al cambiar `q` vuelve a la 1 |
| Carga de `?q=ab&page=2` | Respeta la página 2 (si existe) |
| `page=0`, `-1`, `abc`, `1.5`, vacío, `007`, `1e1`, `+2`, `99999999999999999999` | Página 1, `page: 1` en la respuesta, dirección corregida |
| `page=999` con 3 páginas | Última página (3), dirección corregida |
| Página 1 | `page` omitido de la dirección |
| Borrar el único cliente de la página 3 | Se muestra la página 2 |
| Borrar el único resultado de una búsqueda | "Sin resultados para «q»" |
| Borrar el último cliente | Estado vacío |
| Borrar un cliente sin simulaciones | Diálogo "No tiene simulaciones"; 200 `{ deletedSimulations: 0 }` |
| Borrar un cliente con 1 simulación | Diálogo "1 simulación"; se borran ambos; `{ deletedSimulations: 1 }` |
| Borrar un cliente con 14 simulaciones | Diálogo con 14; se borran todas; `{ deletedSimulations: 14 }` |
| Se crea una simulación entre abrir el diálogo y confirmar | Se borran todas; el aviso informa del número real |
| Fallo a mitad del borrado | Nada se borra |
| Reintento de borrado tras fallo de red, respuesta 404 | Se trata como éxito; se retira de la lista |
| Borrar o editar un id inexistente | 404 `CUSTOMER_NOT_FOUND` |
| `GET`, `PUT` o `DELETE` con id `0`, `-1`, `abc`, `007` | 400 `INVALID_ID` |
| Pedir `/customers/:id/simulations` de un cliente borrado | 404 `CUSTOMER_NOT_FOUND` |
| Pedir una simulación de un cliente borrado | 404 `SIMULATION_NOT_FOUND` |
| Abrir `/customers/:id/edit` por URL directa o recargando | Datos cargados desde el servidor, sin valores del alta |
| Editar guardando los mismos datos | Guardado normal; vuelve a la lista |
| Editar y el nuevo nombre cambia su posición en el orden | Vuelve a la misma búsqueda y página |
| Editar `ES` + DNI `12345678Z` → ` 12345678-z ` (solo formato) | Aceptado, no es duplicado de sí mismo; se guarda `12345678Z` (el normalizador de `shared/` admite espacios, guiones, puntos y minúsculas) |
| DNI `12345678A` (control erróneo; la correcta es Z) | 400 `TAX_ID_INVALID_CHECKSUM` |
| NIE `X1234567L` válido y `X1234567A` inválido | Aceptado el primero; 400 el segundo |
| CIF `A58818501` válido y `A58818502` inválido | Aceptado el primero; 400 el segundo |
| Cambiar país `ES` → `PT` conservando un DNI | 400 por formato o control del NIF portugués |
| Cambiar país a `UK` | 400 `INVALID_COUNTRY` con sugerencia `GB` |
| Cambiar país y NIF a los de otro cliente | 409 con `existingId` del otro |
| Dos ediciones simultáneas al mismo (país, NIF) | Una se guarda; la otra 409, nunca 500 |
| Dos ediciones simultáneas al mismo cliente | Gana la última escritura |
| Cambiar el país de un cliente con simulaciones (ES → US) | Permitido; antiguas intactas; nuevas con país y divisa nuevos; lista, detalle y simulaciones refrescados |
| Cuerpo con campos ajenos (`id`, `createdAt`, `simulationCount`) | 400 `UNKNOWN_FIELD` (primer error) |
| Cuerpo incompleto, vacío o JSON malformado | 400 con código legible (`REQUIRED`, `MALFORMED_JSON`) |
| Doble clic en Guardar o Borrar | Un solo envío efectivo |
| Base de datos antigua con simulaciones, al arrancar | Migrada a cascada sin perder datos; segundo arranque sin cambios |
| Pantalla de 360 px | Paginación, formulario y diálogo sin desbordar |

## Criterios de aceptación
- CA1: con más de 20 clientes se recorren todas las páginas en orden sin repetir ni omitir; `q` y `page` en la dirección; `page` inválida o fuera de rango se normaliza y la respuesta devuelve la página efectiva.
- CA2: con búsqueda activa, total y páginas corresponden a las coincidencias.
- CA3: "Editar" abre `/customers/:id/edit` con los cinco datos cargados desde el servidor (también con URL directa o recarga); tras guardar vuelve a la misma búsqueda y página con los valores nuevos.
- CA4: la edición aplica las mismas validaciones y mensajes que el alta; control erróneo de DNI, NIE o CIF se rechaza; campos ajenos dan `UNKNOWN_FIELD`; ids no canónicos dan `INVALID_ID`.
- CA5: un duplicado con otro cliente (incluida una carrera entre dos ediciones) da 409, nunca 500; un cliente no es duplicado de sí mismo.
- CA6: el borrado pide confirmación con el número de simulaciones, no borra al cancelar y, al confirmar, elimina cliente y simulaciones de forma atómica, devolviendo `deletedSimulations`.
- CA7: el aviso final informa del número real de simulaciones borradas aunque difiera del que mostró el diálogo.
- CA8: las simulaciones de un cliente editado no cambian de importe, IVA, divisa ni tipo; las nuevas usan el país y la divisa nuevos.
- CA9: una base de datos existente con clientes y simulaciones se migra sin perder datos y la migración es idempotente.
- CA10: existen estados de carga, error y vacío en paginación, edición y borrado; teclado, foco y regiones `aria-live` correctos; responsive desde 360 px en ambos temas.
- CA11: `npm test` y `npm run lint` pasan, y `MEMORY.md` y las notas de enmienda quedan según RF31.

## Fuera de alcance
- Borrado masivo o selección múltiple, importar o exportar clientes.
- Borrar o editar simulaciones sueltas (siguen inmutables, D14) y cualquier recálculo de presupuestos guardados.
- Historial o auditoría de cambios, deshacer el borrado, papelera, borrado lógico.
- Control de concurrencia en la edición (versionado o bloqueo): gana la última escritura.
- Editar o borrar desde el detalle del cliente.
- Cambiar los tramos de precio, el IVA, las divisas o el sistema visual.
- Selector de tamaño de página, ordenación configurable o filtros nuevos.
- Autenticación y permisos (quién puede borrar).
