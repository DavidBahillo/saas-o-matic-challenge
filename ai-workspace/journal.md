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
