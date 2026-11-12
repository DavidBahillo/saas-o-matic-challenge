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
