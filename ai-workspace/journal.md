# Diario del proceso

Cómo se ha construido SaaS-O-Matic con IA: qué se hizo en cada etapa, qué se decidió, por qué y cómo se comprobó. Los prompts solo aparecen cuando explican un punto de inflexión; los reutilizables están en [prompt-library.md](prompt-library.md).

---

## Etapa 0 · Entender el reto antes de escribir código
**12 nov 2026**

**Punto de partida.** El enunciado pide un backend con SQLite, un dashboard con conversión de divisas y, sobre todo, evidencias del proceso con IA. Leyendo los criterios de evaluación quedó claro que el 60 % de la nota (planificación más control de calidad) depende de *cómo* se trabaja y no del código. Eso marcó la estrategia: montar primero el sistema de trabajo y después programar.

**Qué se hizo.** Se usó Claude Code en modo plan (sin permiso para editar) para analizar el documento y proponer un plan: monorepo con `shared/` para la lógica pura, backend Express + better-sqlite3 y frontend React. Se identificaron dos huecos del enunciado y se resolvieron como decisiones explícitas en lugar de suposiciones silenciosas:
- el almacenamiento y las llamadas a la API se guardan, pero no suman coste (el enunciado no les asigna precio);
- el IVA sale de una tabla fija por país.

**Corrección de rumbo.** El primer plan era técnicamente correcto pero genérico. Lo rechacé y pedí tres cosas que reflejan mi forma de trabajar: un sistema multiagente basado en el flujo SDD que aprendí en un curso, un registro del proceso y un sistema de diseño propio en modo oscuro. La IA rehízo el plan en torno a eso.

**Decisiones de arquitectura del proceso.**
- **Constitución** ([docs/constitution.md](../docs/constitution.md)): 10 principios innegociables (importes en céntimos, Zod en el borde, capas, archivos de menos de 200 líneas…) que todos los agentes deben leer. Así las reglas no dependen de que yo las repita en cada prompt.
- **Multiagente adaptado de OpenCode a Claude Code:** en el curso el coordinador es un agente principal, pero en Claude Code los subagentes no pueden lanzar otros subagentes. Por eso el coordinador pasó a ser el comando `/sdd`, que se ejecuta en la sesión principal y delega en `planner`, `implementer` y `reviewer`. Se mantuvieron las dos paradas obligatorias para mi aprobación (spec, y plan con tareas).
- **DESIGN.md:** se partió de InsightDeck (teal analítico con acentos púrpura y rosa), pero en modo oscuro sus colores no pasaban el contraste AA, así que se aclararon un nivel. El tema oscuro es el valor de `:root`, sin depender del sistema operativo.

**Verificación.** El hook de registro se probó con una entrada simulada antes de darlo por bueno.

---

## Etapa 1 · Versionado con control humano
**12 nov 2026**

**Qué se hizo.** Añadí una skill propia, `git-commit`, que obliga a Conventional Commits y, sobre todo, a **detenerse para que yo apruebe el mensaje** antes de cualquier commit o push. La adapté al proyecto con scopes del dominio (`pricing`, `tax-id`, `currency`…) y con prohibiciones explícitas (`--force`, `--no-verify`, `--amend`).

**Decisiones.**
- El `.gitignore` deja fuera el PDF del curso (material con copyright), el enunciado de la empresa y el InsightDeck original: el repositorio solo contiene trabajo propio.
- `.gitattributes` con LF para evitar diffs falsos en Windows.
- El repositorio se creó **privado** y se hará público al entregar. Claude Code bloqueó la creación directa como público por ser una acción de publicación; lo tomé como una salvaguarda razonable, no como un obstáculo.

**Incidencia.** La skill se creó a mitad de sesión y no llegó a cargarse, así que el commit inicial (`c8db4c1`) se hizo sin ella. Queda anotado en [ai-tooling.md](ai-tooling.md) para ser transparente.

---

## Etapa 2 · Corregir el propio sistema de registro
**12 nov 2026**

**Problema detectado.** El hook guardaba *todos* los prompts, incluido el ruido ("ya está instalado", textos pegados enteros), en un archivo que se subía al repositorio. Era trazable, pero no aportaba nada a quien lo leyera.

**Primera corrección.** Separé la captura de la documentación:
- los hooks escriben en buffers locales ignorados en git;
- un segundo hook registra qué skills y subagentes se usan;
- `/log` decide qué se documenta.

**Segunda corrección.** El resultado seguía siendo una lista de prompts, y lo que hay que demostrar es el **proceso**. Cambié el formato: este diario cuenta cada etapa (contexto, qué se hizo, decisiones con su porqué, incidencias y verificación) y los prompts solo aparecen como evidencia puntual.

**Lección.** El sistema de documentación también se itera y se audita: la primera versión que propuso la IA cumplía la letra de la petición, pero no su intención.

---

## Etapa 3 · Clientes con validación fiscal estricta en seis países (spec 001)
**12 nov 2026**

**Punto de partida.** No había código. Lo primero era el alta de clientes corporativos con validación del identificador fiscal, porque las simulaciones, el IVA y el dashboard dependen de ella.

**Qué se hizo.** Recorrí entero `/sdd`. El `planner` escribió la spec (32 RF en EARS). El `reviewer` la revisó dos veces como QA y recalculó por script todos los dígitos de control. Después el `planner` hizo el plan con 10 tareas, el `implementer` las ejecutó una por llamada con TDD, y yo comprobé `npm test` y el lint después de cada tarea. El resultado es un monorepo con `shared/` (validadores puros) y `backend/` (Express 5, better-sqlite3 y Zod 4), con `POST /customers`, `GET /customers/:id` y `GET /customers?q=`.

**Decisiones.**
- Algoritmo oficial también en PT, FR (solo SIREN), DE (solo USt-IdNr), IT (con código de oficina) y GB. *Descartado:* validar solo ES, como pedía el enunciado; quería ser estricto con los mercados reales.
- Se rechazan el prefijo de país, los identificadores con todo ceros y el DNI de 7 dígitos: un único valor canónico por cliente para que la unicidad (país + tax ID → 409) sea fiable.
- Orden del listado con colación española, en memoria con `Intl.Collator`. *Descartado:* code point, que deja «Álvarez» detrás de la Z.
- El plan es solo informativo y no afecta al precio (D4). El frontend se crea en la spec 005.
- Subí zod a la 4 y vitest a la 4 antes de escribir código, porque `npm audit` daba vulnerabilidades altas y críticas. better-sqlite3 pasó a la 12, porque la 11 no tiene binario para Node 24 en Windows.

**Corrección de rumbo / control de calidad.**
- La primera revisión de la spec dio 3 bloqueantes: un país vacío con un código distinto, la dependencia entre tax ID y país sin definir y respuestas fuera de la tabla de errores.
- En la validación final lancé dos `reviewer` en paralelo, uno de reglas y otro de cobertura con mutaciones. Los dos devolvieron CAMBIOS NECESARIOS:
  - doble normalización del tax ID;
  - OPTIONS con 200;
  - `%ZZ` con 500;
  - 8 mutaciones que sobrevivían (CIF, Italia, `existingId`, tildes).
- Además decidí que un UTF-8 no válido diera 400 en vez de guardarse corrupto, y enmendé la spec antes de tocar el código.
- Hicieron falta dos vueltas de corrección. En la segunda, el revisor detectó que el `implementer` había dado por cubierto un caso que ningún test comprobaba (`DELETE /customers/%ZZ`).

**Incidencias.**
- La herramienta Write convertía los escapes `\uXXXX` en caracteres literales y rompía ESLint. Desde entonces cada brief lo advierte.
- Un corte por límite de uso detuvo la T10 y se retomó desde donde se quedó.
- En paralelo otra sesión trabajaba en la spec 002 sobre `shared/`, así que la acoté en cada brief.

**Verificación.** 938/938 tests y lint limpio. El revisor de reglas probó la API real (HTTP y servidor con BD temporal). El de cobertura comprobó que 14 de 15 mutaciones mueren; la que sobrevive es equivalente, porque `JSON.parse` ya rechaza el BOM. Falta probar `npm install` en un clon limpio.

**Lección.** Un informe del implementer no es una prueba: lo que no tiene test, no está hecho.

---

## Etapa 4 · Tramos e IVA como regla pura compartida (spec 002)
**12 nov 2026**

**Punto de partida.** El cálculo por tramos es lo que el enunciado evalúa como "cálculo preciso", y la misma cifra tiene que verse en el slider (005) y en la simulación guardada (003). Por eso quería una sola regla pura en `shared/` antes de tocar endpoints.

**Qué se hizo.** Recorrí `/sdd` entero. El `planner` redactó la spec con cinco preguntas, que respondí una a una. El `reviewer` la revisó dos veces como QA y recalculó todos los importes. El plan salió con 5 tareas, que el `implementer` hizo una por llamada con TDD, y yo comprobé `npm test` y el lint después de cada una. El resultado es `shared/src/pricing/`, con `calculateBaseCost` y `calculateQuote`, que nunca lanzan excepciones.

**Decisiones.**
- Los tramos son fijos y están congelados en `shared/`. *Descartado:* configurarlos por entorno o en la BD, porque obligaría a sincronizar el frontend en tiempo de ejecución.
- El IVA entra en la 002 y solo se aplica sobre la base de tramos, con half-up y enteros. *Descartado:* una función de IVA sobre bases arbitrarias, porque base × tipo podía superar el entero seguro, que era el bloqueante del QA.
- El país es estricto, sin normalizar, con los mismos códigos que la 001. Se extrajo `checkCountryCode` del validador de la 001 para no duplicarlo.
- Los campos ajenos (`storage`, `apiCalls`, `plan`) se ignoran, y Zod los rechazará en la 003.
- Un bloque de ESLint prohíbe `Date`, `Intl`, `Math.random` y `node:*` en `pricing/` para garantizar la pureza.

**Corrección de rumbo / control de calidad.** Rechacé que la spec mostrara los importes en céntimos, porque no se podía contrastar con el enunciado. Primero añadimos los euros al lado, y al final la spec quedó solo en euros, con una nota que fija la implementación en céntimos (D2). En la validación, el `reviewer` de reglas dio APROBADO (16/16 RF) y el de cobertura CAMBIOS NECESARIOS, porque las filas `-0` y `1e1` no fijaban el desglose. Bastó una vuelta de corrección.

**Incidencias.** En la T4 escribió también otro agente, de la sesión de la spec 003, que trabajaba en la misma carpeta: mi `implementer` encontró el código ya hecho y sus tests sustituidos. Paré antes de la T5, pausé la 003 y pedí al `reviewer` que examinara línea a línea esos archivos, que encajaban con el plan.

**Verificación.** 1092/1092 tests y lint limpio. Las propiedades se comprueban de forma exhaustiva de 0 a 100 000 usuarios en 8 países. La regla de pureza se probó con un `Date.now()` temporal, que hizo fallar el lint.

**Lección.** Dos sesiones sobre la misma carpeta necesitan coordinación explícita; el aviso de un subagente evitó que se pisaran más.

---

## Etapa 5 · Simulaciones guardadas con precio congelado (spec 003)
**12 nov 2026**

**Punto de partida.** Con la regla de precio pura lista (002), faltaba el borde HTTP: guardar presupuestos ligados a un cliente y rechazar con Zod los campos ajenos, como dejó pendiente D13.

**Qué se hizo.** Recorrí `/sdd` entero. El `planner` planteó cinco preguntas cerradas y elegí sus recomendaciones: simulación ligada al cliente (el país del IVA sale de él), precio congelado, `storage`/`apiCalls` opcionales a 0, tres endpoints de lectura e inmutabilidad. El plan salió con 10 tareas, que el `implementer` hizo una por llamada con TDD; yo comprobé `npm test` tras cada una.

**Decisiones.**
- Precio congelado al guardar. *Descartado:* recalcular al leer, porque un presupuesto no debe cambiar si cambian los tramos o el IVA.
- `PRAGMA foreign_keys = ON` en toda conexión y FK `ON DELETE RESTRICT`. *Descartado:* borrado físico o lógico de simulaciones.
- Validación pura en `shared/src/simulations/` envuelta por Zod. *Descartado:* `z.strictObject`, que no da el orden de errores de la spec.

**Corrección de rumbo / control de calidad.** El QA de la spec devolvió NECESITA CAMBIOS (4 importantes, entre ellos que SQLite no aplicaba las FK sin el PRAGMA) y el `planner` los corrigió antes de que la aprobara. La validación final dio APROBADO a la primera (20 RF y 7 CA).

**Incidencias.**
- La T1 rompía el catálogo de errores de la 001: decidí mover `SIMULATION_NOT_FOUND` a la T7, junto a su endpoint, en vez de debilitar el test.
- Con `RESTRICT`, SQLite señala el borrado como `SQLITE_CONSTRAINT_TRIGGER` y no `FOREIGNKEY`: mantuve RESTRICT y corregí el plan.
- Al empezar, la 002 apareció ya commiteada desde otra sesión; lo verifiqué antes de seguir.

**Verificación.** 1281/1281 tests y lint limpio. Quedan tres mejoras opcionales del reviewer (helper de errores por spec, `parseRouteId`, salto de línea final).

**Lección.** Cuando el plan choca con la realidad (SQLite, un test existente), es mejor parar y decidir que adaptar el test en silencio.

---

## Etapa 6 · Presupuestos multidivisa con el tipo de cambio congelado (spec 004)
**2026-11-13**

**Punto de partida.** Los presupuestos solo existían en euros. El equipo comercial necesita presentarlos en USD y GBP sin que el importe cambie con el mercado después de enviarlos.

**Qué se hizo.** Recorrí `/sdd` completo. El planner redactó la spec y dejó abiertas cinco dudas, que resolví una a una. El reviewer hizo la clarificación. El planner preparó plan y tareas: 6 tareas en dos bloques. El implementer hizo el bloque A (enmiendas a la constitución, a la 003 y a MEMORY, y la conversión pura en `shared/`) y luego el bloque B (migración, proveedor Frankfurter con caché, alta asíncrona y `GET /exchange-rates`).

**Decisiones.**
- Tipos de una API externa (Frankfurter/BCE, sin clave) con caché de 24 h en memoria y por divisa. Si no hay tipo vigente, 500 `EXCHANGE_RATE_UNAVAILABLE`. *Descartado:* tabla fija, que es lo que proponía la IA, porque quería tipos reales.
- El tipo y la fecha se congelan al crear la simulación, y `currency` es un campo opcional con EUR por defecto. *Descartado:* convertir al leer.
- Base e IVA se convierten por separado con half-up, y el total es la suma. Los tramos se quedan en euros.
- El tipo se maneja en micro-unidades enteras, en el rango de 0,01 a 100, para mantener la exactitud sin BigInt ni float.
- La UI de la 005 puede mostrar una vista previa con `GET /exchange-rates`, pero lo que vale es lo congelado.

**Corrección de rumbo / control de calidad.** Al elegir una API externa obligué a enmendar el principio 2 de la constitución y la 003. En la clarificación, el reviewer devolvió CAMBIOS NECESARIOS con 7 bloqueantes. El más serio: ninguna fila de ejemplo distinguía "total = suma" de "convertir el total", así que una implementación incorrecta habría pasado todos los tests. También faltaban el formato del tipo y su cota frente a overflow. En la validación final el reviewer dio APROBADO sin vueltas de corrección.

**Incidencias.** El planner escribió de memoria la URL y la forma de la respuesta de Frankfurter. Las verificó el implementer con una petición real, sin cambios. El TDD no se vio en rojo en la configuración ni en los tests HTTP.

**Verificación.** 1512/1512 tests y lint limpio. Ningún test usa la red: el proveedor y el reloj se inyectan.

**Lección.** Una tabla de casos solo sirve si alguna fila hace fallar la implementación equivocada.

---

## Etapa 7 · Dashboard en React sobre la API existente (spec 005)
**2026-11-13**

**Punto de partida.** El backend ya calculaba, guardaba y convertía presupuestos, pero el equipo comercial no tenía interfaz: `frontend/` estaba previsto en la 005 desde D11.

**Qué se hizo.** Recorrí las 7 fases de `/sdd`. El planner devolvió 5 preguntas antes de escribir nada; las respondí una a una (alcance completo con simulador, solo EUR/USD/GBP, `simulationCount` en el backend, rutas por URL, tema y modo presentación). El implementer trabajó en tres bloques: `shared/` y backend con el contador y el workspace; base del frontend (cliente API con Zod, tema, header); y pantallas, simulador y modo presentación.

**Decisiones.**
- Proxy de Vite `/api` en lugar de CORS: el backend no cambia más que en `simulationCount`.
- `simulationCount` con subconsulta en cada lectura, sin columna ni migración; enmienda explícita de los contratos 001 y 003.
- Slider de 0 a 100 con campo numérico hasta 100 000, en lugar del slider de 0 a 100 000 que proponía el planner.
- Descartados Redux, Tailwind, librería de gráficos y msw.

**Corrección de rumbo / control de calidad.** El reviewer de clarificación marcó 6 bloqueantes en la spec (CORS, slider inusable, divisa activa ambigua…); el planner la rehízo con mis decisiones y pasó de 36 a 40 RF. En validación lancé dos reviewers: lógica aprobó a la primera; UI pidió cambios dos veces (contraste AA en tema claro y etiquetas partidas; después desbordamiento a 360 px con 100 000 usuarios). Tras la segunda vuelta, APROBADO.

**Incidencias.** jsdom 31 exige un Node más nuevo y se fijó la 29.1.1; react-router salió en la 8.5.1 en vez de la 7 del plan. El reviewer de UI verificó el navegador con una BD aislada (`DB_PATH` en el scratchpad) para no tocar la de desarrollo.

**Verificación.** 1820/1820 tests y lint limpio. CA7 comprobado en Chrome headless a 360 px y 1280 px, en ambos temas y en modo presentación.

**Lección.** Los tests en jsdom no ven el layout: el móvil solo se valida abriendo un navegador.

---

## Etapa 8 · README y datos semilla para probar la herramienta (spec 006)
**2026-11-13**

**Punto de partida.** La herramienta estaba completa, pero un recién llegado abría una lista vacía y no tenía instrucciones para arrancarla; la 005 había dejado README y datos de ejemplo fuera de alcance.

**Qué se hizo.** Recorrí `/sdd` completo. El planner redactó la spec con 6 preguntas abiertas (comando, volumen, idempotencia, tipos de cambio, idioma) y las respondí una a una. El implementer trabajó en dos bloques: el seed del backend (datos, tipos fijos, validación previa y transacción) y el README con un test de coherencia.

**Decisiones.**
- `npm run seed` idempotente, sin `--reset`: descarté borrar y resembrar para no arriesgar datos reales.
- Tipos fijos 1,10 USD y 0,85 GBP sin red, en lugar de Frankfurter: cifras deterministas (98,18 USD) y seed sin conexión.
- Las simulaciones semilla solo van a clientes creados en esa ejecución (U7): sin marca de "semilla" en el esquema no hay otra forma fiable de no duplicar.
- `runInAsyncTransaction` con BEGIN/COMMIT/ROLLBACK en `repositories/`, porque `db.transaction` no admite `await` y así se reutilizan los servicios en vez de insertar filas a mano.

**Corrección de rumbo / control de calidad.** En mi revisión QA detecté la ambigüedad de la idempotencia y la cerré con U7. El planner encontró al planificar que 8 clientes no cubrían los 9 casos de RF3; subí U2 a 9. El reviewer dio APROBADO sin vueltas de corrección y aceptó la excepción de SQL de transacción.

**Verificación.** 1866/1866 tests y lint limpio. El seed se ejecutó dos veces sobre una BD temporal (9 + 14, después 0 creados) y el reviewer levantó el backend con esos datos y comprobó `simulationCount` contra cada lista. Un test verifica que cada script, variable, endpoint y enlace del README existe.

**Lección.** Contar los casos de cobertura antes de fijar un número evita contradicciones dentro de la misma spec.

---

## Etapa 9 · Divisas en vivo, moneda por país y banderas (spec 007)
**2026-11-13**

**Punto de partida.** Al revisar la app en el navegador vi que el selector solo ofrecía EUR, USD y GBP; pedí tipos de una API pública (open.er-api.com), que el simulador partiera de la moneda del país del cliente y banderas en las tarjetas servidas desde un CDN, no desde el repositorio.

**Qué se hizo.** Recorrí `/sdd` completo. El planner redactó la spec con 5 preguntas (proveedor, qué divisas, dónde se elige el país, respaldo, banderas) que respondí una a una. El implementer trabajó en dos bloques: `shared/` + backend (lista fija de 23 divisas, tabla país→divisa, proveedor open.er-api con snapshot único, migración del CHECK de `simulations`) y frontend + documentación (preselección por visita, selector ampliado, atribución, `CountryFlag` de flagcdn.com, DESIGN/README/MEMORY y enmiendas en 004 y 005).

**Decisiones.**
- open.er-api.com vía backend en lugar de Frankfurter o de que el navegador llame directo: más divisas sin romper el principio de pasar por el backend.
- Lista fija de 23 divisas de 2 decimales y tolerancia por divisa, frente a una lista dinámica o "todo o nada": testeable y sin que una divisa caída tumbe el selector.
- Preselección con el país del cliente al abrir su simulador (EUR de respaldo), descartando añadir un selector de país.
- Bandera + código ISO visible, descartando emoji (Windows no los pinta).

**Corrección de rumbo / control de calidad.** El reviewer de clarificación devolvió CAMBIOS NECESARIOS (lista "cerrada" que dependía de la API, enmiendas no declaradas, preselección con carga asíncrona, números JSON frente a texto decimal); el planner pasó de 14 a 22 RF. Al planificar apareció un CHECK en la BD que impedía guardar en CHF, resuelto con una migración. En validación, lógica aprobó a la primera; UI pidió una vuelta por el desbordamiento del `<select>` a 360 px y la preselección estrictamente única.

**Incidencias.** El bloque de frontend se cortó por el límite de uso y se retomó desde donde quedó. La preview del navegador sobrescribía `PORT`, así que separé backend y frontend en `launch.json`.

**Verificación.** 2026/2026 tests y lint limpio. En el navegador a 360 px: sin scroll horizontal, banderas con `alt` en español y cliente de EE. UU. abierto en USD. Pendiente de CA7: contraste en ambos temas, teclado/lector con lista larga y respaldo sin red.

**Lección.** Las preguntas de la spec deben contrastarse con la forma real de la respuesta del proveedor antes de fijar reglas de parseo.

---

## Etapa 10 · Rediseño visual y de composición con Verdana (spec 008)
**2026-11-13 / 2026-11-14**

**Punto de partida.** La UI no me gustaba: paleta turquesa y púrpura, todo en tarjetas iguales y un simulador apilado sin jerarquía. Busqué skills con `find-skills` e instalé `frontend-design` y `web-design-guidelines`; decidí rediseñar primero y auditar después, para no revisar una UI que iba a cambiar.

**Qué se hizo.** Sustituí `DESIGN.md` por el sistema Verdana Health y lancé `/sdd`. El planner redactó la spec; el reviewer la devolvió dos veces con CAMBIOS NECESARIOS (tokens sin fuente única, oscuro aproximado, contraste sin método). La primera versión era solo un cambio de piel: lo rechacé y pedí aplicar de verdad `frontend-design`, que produjo un mockup de composición (detalle en dos columnas, escalera de tramos sobre el slider, hoja de presupuesto, lista densa de clientes) que aprobé. El implementer lo hizo en tres bloques y después en cinco rondas de cambios pedidos tras verlo en el navegador.

**Decisiones.**
- Oscuro por defecto derivado del mockup Dark de Verdana, claro como alternativa; descarté quedarme solo con el claro.
- Google Fonts por CDN en vez de autoalojar (sin dependencias; acepto la IP a Google por ser herramienta interna).
- Retiré la atribución de ExchangeRate-API (deroga parte de la 007).
- Barra sin importes con nombres o abreviaturas y tooltip; escalera de tres cuadrados iguales; tablas centradas.
- Atajo de presentación Alt+P en lugar de P, para cumplir WCAG 2.1.4.
- Editar y borrar clientes y la paginación quedan para una spec futura; los botones existen deshabilitados con "Próximamente".

**Corrección de rumbo / control de calidad.** Dos reviewers en paralelo (lógica y UI) dieron CAMBIOS NECESARIOS; tras una vuelta, APROBADO. Dos auditorías con `web-design-guidelines` (0 críticos) destaparon problemas de foco, `aria-live` y una regresión táctil en móvil que se corrigieron. Edité a mano la hoja de presupuesto a mitad de proceso; se limpió el código comentado y se adaptaron los tests.

**Incidencias.** El servidor de Vite se quedaba con módulos antiguos tras refactors grandes (página en blanco); se resolvió con un servidor de comprobación aparte en el puerto 5174.

**Verificación.** 2348/2348 tests y lint en verde. Revisión en navegador a 1280, 1024, 375 y 360 px, ambos temas y presentación. Sin verificar a mano: forced-colors, lector de pantalla y táctil real.

**Lección.** Un rediseño que conserva la estructura no es un rediseño: la composición hay que pedirla explícitamente.

---

## Etapa 11 · Clientes editables y borrables, con lista paginada (spec 009)
**2026-11-14**

**Punto de partida.** La lista de clientes tenía un tope de 50 resultados sin paginación, y los botones "Editar" y "Borrar" estaban desactivados con el rótulo "Próximamente". Pedí que la edición usara el mismo formulario del alta, con todos los datos ya cargados al pulsar "Editar".

**Qué se hizo.** Recorrí el flujo `/sdd` completo:
- El planner redactó la spec, a la que respondí 9 preguntas abiertas.
- Por el tamaño de la spec, la revisión de QA la hizo el reviewer, que devolvió 8 bloqueantes, casi todos del contrato de la API, de la migración y de la atomicidad. Los resolví aceptando valores por defecto concretos. La spec quedó con 31 RF.
- El planner escribió un plan de 6 tareas.
- El implementer trabajó en 3 bloques: shared con migración y backend, después el frontend y al final la documentación con la comprobación en navegador.

**Decisiones.**
- Borrado físico en cascada de las simulaciones. Descarté bloquear con 409 y archivar, porque prefiero poder limpiar clientes de verdad. Esto enmienda D14 y obliga a reconstruir la tabla `simulations` con una migración idempotente.
- 20 clientes por página, y el servidor normaliza `page` en lugar de dar un 400.
- Editar y Borrar solo en la lista, no en el detalle.
- Al editar se puede cambiar el país aunque haya simulaciones, porque esas quedan congeladas.
- `PUT` con el cuerpo completo y `UNKNOWN_FIELD` primero. Del NIF duplicado se encarga el índice UNIQUE, así que el cliente nunca es duplicado de sí mismo y una carrera entre dos ediciones da 409.

**Corrección de rumbo / control de calidad.**
- La QA de la spec terminó en REQUIERE CORRECCIONES, y lo resolvimos en una vuelta.
- El implementer se desvió del plan de forma justificada: un parser propio para el `PUT` y un 409 sin `existingId` en lugar de un 500.
- En el bloque de frontend no se escribieron los tests en rojo antes que el código. Queda anotado.
- En la validación usé dos reviewers en paralelo, uno de lógica y otro de UI. Los dos dieron APROBADO a la primera.

**Incidencias.**
- Unos servidores Vite viejos en 5173 y 5174 servían módulos desactualizados y la pantalla salía en blanco. Se verificó en :5199 y no se mataron esos procesos por permisos.
- Se corrigió un desbordamiento anterior a esta spec en los campos de "Empresa" a 360 px.
- El aviso que llega por `location.state` reaparecía al recargar. Ahora se limpia del historial.

**Verificación.** 2515/2515 tests en verde y lint limpio. En navegador, con una BD temporal:
- A 360 px, en modo claro y oscuro: paginación, edición precargada entrando por URL directa y borrado de un cliente con 2 simulaciones.
- No se probaron a mano: Escape y clic fuera del diálogo, el diálogo en modo oscuro y el 409 al editar.

**Lección.** Una QA exigente de la spec antes del plan hizo que la implementación saliera aprobada a la primera.

---

## Etapa 12 · Auditoría de diseño: tema claro con contraste real y UI más legible
**2026-11-14**

**Punto de partida.** El tema claro era casi blanco y sus tokens apenas contrastaban entre sí; además había detalles de UI poco claros (botones sin fondo, paginación apretada, columnas mezcladas, flechas inconsistentes, textos largos en botones). Hice una auditoría de 25 puntos y la dejé primero como pendiente en `ai-workspace/ui-audit-pending.md`.

**Qué se hizo.** Recorrí `/sdd` como spec 010. El planner convirtió la auditoría en 29 RF; respondí 5 dudas (línea del botón de tema, fondo de botones, columna Simulaciones en móvil, despliegue por fila, centrado del formulario). El implementer trabajó en 3 bloques: tokens claros y componentes compartidos (chevron único, iconos SVG propios, `PlanBadge`, `SaveButton`, `SelectShell`); lista, detalle y formularios; animaciones y documentación.

**Decisiones.**
- Fondo claro `#E9E9E9` con jerarquía fondo < surface-2 < superficie blanca; sage `#34D399` e info `#38BDF8` más claros y saturados.
- Acepto que los rellenos sage/info queden a 1,6/1,8:1 contra el fondo (no textual): incompatible con quererlos claros; siempre llevan texto o borde.
- Paginación no activa sobre `--color-surface` y no sobre `--color-bg`, porque sobre el fondo de página sería invisible.
- Símbolos de divisa descartados: open.er-api.com no los da y no quise salirme del proveedor.
- Iconos SVG propios en vez de una librería; chevron de `<select>` por `mask-image` para no escribir colores literales.

**Corrección de rumbo / control de calidad.** La QA de la spec devolvió CAMBIOS NECESARIOS (3 bloqueantes: paginación invisible, superficies claras por encima del nuevo fondo, viabilidad del chevron en selects nativos) y cifras de contraste erróneas; se corrigió en una vuelta. En validación, el reviewer de lógica dio APROBADO; el de UI no tenía navegador, así que verifiqué yo y encontré el chevron de País y Plan fuera del campo; se corrigió en una vuelta.

**Incidencias.** En el bloque 2 los tests se escribieron junto al código, no antes. Un script de Python convirtió archivos a CRLF y rompió los tests que leen `DESIGN.md`; se normalizó a LF.

**Verificación.** 2637/2637 tests y lint limpio. En navegador: lista, paginación, detalle, formulario y header en claro y oscuro, y lista a 375 px sin desbordamiento. Sin verificar a mano: animaciones, tooltip con teclado, forced-colors y lector de pantalla.

**Lección.** Un reviewer sin navegador no valida UI: la comprobación visual tiene que hacerla quien lo tenga.

- **2026-11-15 · /feature · País y Plan en la misma fila.** Qué: en el formulario de alta y edición (`CustomerFields.tsx`), País y Plan van en una fila `.form-row` (2fr/1fr), apilada por debajo de 480 px, con el chevron dentro de cada select. Prompt: "quiero que pais y plan esten los 2 en la misma linea respetando su desplegable". Resultado: 2637/2637 tests en verde; verificado en navegador.

- **2026-11-16 · /feature · README paso a paso.** Qué: `README.md` con "Puesta en marcha (paso a paso)" (requisitos y build tools de better-sqlite3, clonar, `npm install` solo en la raíz por workspaces, seed, dev, URLs, tests, parar), problemas frecuentes, `BACKEND_URL` en la tabla, aviso de que no se lee `.env` con ejemplos bash/PowerShell, y API con `PUT`/`DELETE /customers/:id` y `curl` para PowerShell. Prompt: "Dejame el readme para que si una persona clona el repositorio sepa paso a paso que tiene que hacer". Resultado: seed sobre base vacía, backend con `PORT` y `curl` verificados; 2637/2637 tests en verde.
