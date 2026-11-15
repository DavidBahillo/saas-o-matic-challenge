---
description: Documenta el PROCESO de la sesión en ai-workspace/journal.md (contexto, qué se hizo, decisiones, incidencias, verificación) y actualiza el inventario de herramientas
argument-hint: [título opcional de la etapa]
---

Documenta **el proceso** de esta sesión como una nueva etapa del diario. No es una lista de prompts: es el relato de cómo se trabajó y por qué. Título sugerido: $ARGUMENTS

## Fuentes (buffers locales, no versionados)
- `.claude/logs/prompts.jsonl`: lo que pidió el usuario (sirve para reconstruir la intención, no para copiarlo). Si la conversación actual ya contiene la sesión, no lo leas; si lo lees, solo las entradas desde la última etapa.
- `.claude/logs/activity.jsonl`: skills y subagentes usados.
- `git log --oneline` y `git diff --stat` desde la última etapa, más los cambios en `specs/` y `MEMORY.md`.

## 1. Escribir la etapa al FINAL de `ai-workspace/journal.md`
No leas el journal entero: obtén el último número con `grep -n "^## Etapa" ai-workspace/journal.md | tail -1` y añade la etapa siguiente al final. Prosa breve, entre 10 y 25 líneas en total:

```
---

## Etapa N · <título que describa el avance, no la tarea>
**<fecha>**

**Punto de partida.** <qué problema o necesidad había y por qué importaba>

**Qué se hizo.** <cómo se abordó: fases de /sdd recorridas, qué agente hizo qué, qué se construyó>

**Decisiones.** <lista breve: decisión + alternativa descartada + motivo>

**Corrección de rumbo / control de calidad.** <qué propuso la IA que se rechazó o corrigió y por qué; veredictos del reviewer y cuántas vueltas hubo>

**Incidencias.** <problemas de herramientas o del plan y cómo se resolvieron> (omitir si no hubo)

**Verificación.** <tests (X/X), comprobaciones manuales, navegador o móvil>

**Lección.** <1 línea, solo si hay una de verdad>
```

Reglas:
- Escribe en primera persona del desarrollador ("rechacé", "decidí"): el responsable es la persona, la IA ejecuta.
- Cita un prompt **solo** si explica un punto de inflexión, y como mucho uno por etapa, recortado a 150 caracteres.
- Menciona las skills y subagentes dentro del relato (por ejemplo, "el reviewer devolvió CAMBIOS NECESARIOS por…"), no en una lista suelta.
- Nada de relleno: si una sección no aporta nada, se omite.

## 2. Actualizar los registros de apoyo
- `ai-workspace/ai-tooling.md`: añade o actualiza la fila de cualquier skill, subagente, comando o hook usado por primera vez o modificado.
- `ai-workspace/prompt-library.md`: solo si apareció un prompt reutilizable nuevo, con una línea de por qué funciona.
- `MEMORY.md`: solo si cambió una decisión vigente.

## 3. Vaciar los buffers
Deja vacíos `.claude/logs/prompts.jsonl` y `.claude/logs/activity.jsonl`.

Responde solo con la etapa añadida.
