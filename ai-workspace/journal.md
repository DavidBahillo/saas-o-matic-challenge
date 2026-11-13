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
