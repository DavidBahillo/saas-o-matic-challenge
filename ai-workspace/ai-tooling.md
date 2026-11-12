# AI tooling — skills, agentes, comandos y hooks del proyecto

Inventario de lo que se ha configurado para dirigir a la IA y de para qué se ha usado. Se mantiene con `/log`.

| Tipo | Nombre | Archivo | Para qué | Primer uso |
|---|---|---|---|---|
| Comando (coordinador) | `/sdd` | [sdd.md](../.claude/commands/sdd.md) | Flujo SDD de 7 fases con aprobaciones humanas | 2026-11-12 (spec 001) |
| Subagente | `planner` | [planner.md](../.claude/agents/planner.md) | Spec EARS, plan y tareas; solo escribe en `specs/` | 2026-11-12 (spec 001) |
| Subagente | `implementer` | [implementer.md](../.claude/agents/implementer.md) | Una tarea por llamada, con TDD | 2026-11-12 (spec 001, T1–T11) |
| Subagente | `reviewer` | [reviewer.md](../.claude/agents/reviewer.md) | QA de la spec y veredicto RF por RF; en paralelo (reglas / cobertura con mutaciones) | 2026-11-12 (spec 001) |
| Comando | `/feature` | [feature.md](../.claude/commands/feature.md) | Cambios pequeños sin spec | pendiente |
| Comando | `/log` | [log.md](../.claude/commands/log.md) | Documentar solo lo importante | 2026-11-12 |
| Skill | `git-commit` | [SKILL.md](../.claude/skills/git-commit/SKILL.md) | Conventional Commits con aprobación antes de commit y push | creada el 2026-11-12; el commit inicial se hizo antes de que estuviera cargada |
| Hook | `UserPromptSubmit` | [log-prompt.mjs](../.claude/hooks/log-prompt.mjs) | Buffer local de prompts (filtra lo trivial y resume lo pegado) | 2026-11-12 |
| Hook | `PostToolUse` | [log-activity.mjs](../.claude/hooks/log-activity.mjs) | Buffer local del uso de skills y subagentes | 2026-11-12 |
| Herramienta externa | GitHub CLI | — | Crear el repositorio remoto | 2026-11-12 |

**Configuración usada al planificar:** Claude Code en modo plan para el análisis del enunciado, con Opus como modelo principal.
