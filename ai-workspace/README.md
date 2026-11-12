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

## 3. Vibe coding y control de calidad — sistema de guardado
| Nivel | Archivo | Cómo se genera |
|---|---|---|
| Captura completa | [`prompts-log.jsonl`](prompts-log.jsonl) | Automática: el hook `UserPromptSubmit` ([`log-prompt.mjs`](../.claude/hooks/log-prompt.mjs)) guarda cada prompt |
| Resumen breve | [`journal.md`](journal.md) | `/log` al cerrar cada sesión o spec: objetivo, prompt clave, lo que la IA propuso → lo que decidí, resultado |
| Lo reutilizable | [`prompt-library.md`](prompt-library.md) | Los mejores prompts, curados por `/log` |
| Evidencias | [`screenshots/`](screenshots/) | Capturas de momentos clave |

Cómo leerlo rápido: empieza por `journal.md`, consulta `prompt-library.md` para ver la técnica y baja a `prompts-log.jsonl` si quieres la trazabilidad completa.
