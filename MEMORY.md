# MEMORY — estado vivo del proyecto

Breve: menos de 60 líneas. Solo decisiones vigentes y estado. El histórico está en `ai-workspace/journal.md`.

## Decisiones vigentes
- D1 · Stack: monorepo npm con `shared/`, `backend/` (Express + SQLite) y `frontend/` (React + Vite). *Descartado:* NestJS, demasiado ceremonioso para el alcance.
- D2 · Importes en céntimos enteros. *Descartado:* `number` con decimales, por errores de coma flotante.
- D3 · Cálculo de tramos compartido en `shared/` para que el slider responda en tiempo real y coincida con el backend.
- D4 · Coste base = solo tramos de usuarios. El almacenamiento y las llamadas a la API se guardan pero no suman (el enunciado no les asigna precio).
- D5 · IVA mediante una tabla fija por país en `shared/` (ES 21 %, PT 23 %, FR 20 %, DE 19 %, IT 22 %, GB 20 %, US 0 %, resto 0 %).
- D6 · UI en modo oscuro por defecto (`DESIGN.md`), basada en InsightDeck.
- D7 · Multiagente: el coordinador es el comando `/sdd` (en Claude Code los subagentes no anidan).
- D8 · Commits solo con la skill `/git-commit`: Conventional Commits en inglés y aprobación humana antes de commit y push.

## Estado de specs
| Spec | Estado |
|---|---|
| 001-customers-taxid | pendiente |
| 002-tiered-pricing | pendiente |
| 003-simulations | pendiente |
| 004-currency | pendiente |
| 005-dashboard-ui | pendiente |
| 006-readme-seed | pendiente |
