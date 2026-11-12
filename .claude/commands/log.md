---
description: Guarda un resumen breve y autodocumentado de la sesión en ai-workspace/journal.md, con los prompts clave
argument-hint: [título opcional de la entrada]
---

Registra lo más importante de esta sesión de forma **breve**. Título sugerido: $ARGUMENTS

1. Lee `ai-workspace/journal.md` para ver la fecha y hora de la última entrada.
2. Lee `ai-workspace/prompts-log.jsonl` y quédate con los prompts posteriores a esa entrada (ignora los de `/log`).
3. Revisa `git log --oneline` y `git diff --stat` desde la última entrada (si hay repositorio git).
4. Añade al FINAL de `journal.md` una entrada con este formato exacto, de 8 líneas como máximo:

```
## AAAA-MM-DD HH:MM · <título>
- **Objetivo:** <1 línea>
- **Prompt clave:** > "<cita literal y recortada del prompt que más dirigió el trabajo>"
- **La IA propuso → yo decidí:** <qué se aceptó, qué se rechazó o corrigió y por qué>
- **Resultado:** <tests X/X · archivos o specs tocados · commit>
- **Aprendizaje:** <1 línea, opcional>
```

5. Si algún prompt de la sesión es reutilizable y especialmente efectivo, añádelo a `ai-workspace/prompt-library.md` en su categoría, con una línea de por qué funciona. No dupliques los que ya existen.
6. Si cambió alguna decisión de arquitectura, actualiza `MEMORY.md` (sin pasar de 60 líneas).
7. Responde con la entrada añadida y nada más.
