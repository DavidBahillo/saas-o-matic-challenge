---
description: Cambio pequeño sin spec - implementa, testea y registra en una sola pasada
argument-hint: <cambio pequeño>
---

Cambio pequeño para SaaS-O-Matic, sin flujo SDD: $ARGUMENTS

1. Si el cambio afecta a reglas de negocio, a la API o a la base de datos, PARA y recomienda `/sdd`.
2. Lee `CLAUDE.md`, `docs/constitution.md` y, si hay UI, `DESIGN.md`.
3. Si cambia lógica, añade o ajusta primero un test; después haz el cambio mínimo.
4. Ejecuta `npm test` y no termines con tests en rojo.
5. Lanza el subagente `reviewer` sobre el `git diff` con foco en la constitución.
6. Añade a `ai-workspace/journal.md` una entrada de 3 líneas: qué, prompt y resultado.
