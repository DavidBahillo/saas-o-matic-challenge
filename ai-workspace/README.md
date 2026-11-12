# ai-workspace — cómo se construyó SaaS-O-Matic con IA

Esta carpeta documenta el **proceso**: cómo se planificó, se dirigió y se auditó a la IA (Claude Code).

## 1. Planificación (Spec-Driven Development)
- Principios innegociables: [`docs/constitution.md`](../docs/constitution.md)
- Specs por feature: [`specs/`](../specs/), cada una con `spec.md` (requisitos EARS), `plan.md` y `tasks.md`.
- Decisiones vigentes: [`MEMORY.md`](../MEMORY.md)

## 2. Arquitectura y directrices para la IA
- Reglas globales para la IA: [`CLAUDE.md`](../CLAUDE.md)
- Sistema de diseño (oscuro por defecto): [`DESIGN.md`](../DESIGN.md)
- Sistema multiagente, adaptado del flujo coordinador → planner → implementer → reviewer:

| Pieza | Archivo | Rol | Puede editar |
|---|---|---|---|
| Coordinador | [`/sdd`](../.claude/commands/sdd.md) | Dirige las 7 fases, pasa el contexto y pide aprobación al usuario | nada |
| Planner | [`planner`](../.claude/agents/planner.md) | Spec (EARS), plan y tareas | solo `specs/` |
| Implementer | [`implementer`](../.claude/agents/implementer.md) | Una tarea por llamada, con TDD | código |
| Reviewer | [`reviewer`](../.claude/agents/reviewer.md) | QA de la spec y veredicto RF por RF | nada |

Además:
- [`/feature`](../.claude/commands/feature.md) para cambios pequeños.
- [`/log`](../.claude/commands/log.md) para documentar.
- La skill [`/git-commit`](../.claude/skills/git-commit/SKILL.md) para versionar: inspecciona el diff, propone un mensaje Conventional Commits (`feat(pricing): add cumulative tiered pricing`), **se detiene hasta que el usuario lo aprueba** y solo entonces hace commit y push. Así cada commit del historial pasa por una revisión humana.

## 3. Vibe coding y control de calidad — documentación del proceso
El entregable es **el relato del proceso**, no un volcado de prompts. Los hooks capturan en local lo que ocurre y `/log` lo convierte en una etapa del diario.

```
lo que pido + skills y subagentes usados
        │  hooks (automático, filtrado, fuera de git)
        ▼
.claude/logs/*.jsonl          ← materia prima local
        │  /log al cerrar cada sesión o spec
        ▼
journal.md (etapas del proceso) · ai-tooling.md · prompt-library.md
```

| Archivo | Qué contiene |
|---|---|
| [`journal.md`](journal.md) | **Diario del proceso** por etapas: punto de partida, qué se hizo, decisiones con la alternativa descartada, correcciones a la IA, incidencias, verificación y lección |
| [`ai-tooling.md`](ai-tooling.md) | Inventario de skills, subagentes, comandos y hooks, con su primer uso |
| [`prompt-library.md`](prompt-library.md) | Anexo: los pocos prompts reutilizables y por qué funcionan |
| [`screenshots/`](screenshots/) | Capturas de momentos clave |

**Hooks de captura** (materia prima, nunca se entregan tal cual):
- [`log-prompt.mjs`](../.claude/hooks/log-prompt.mjs): ignora confirmaciones y mensajes triviales, resume el contenido pegado y etiqueta los comandos.
- [`log-activity.mjs`](../.claude/hooks/log-activity.mjs): registra cada uso de skill o subagente.

Cómo leerlo rápido: lee `journal.md` de arriba abajo; es la historia completa del proyecto.
