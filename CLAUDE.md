# SaaS-O-Matic — Reglas para la IA

Herramienta interna para que el equipo comercial simule y presupueste suscripciones SaaS multidivisa.

## Lee siempre antes de actuar
- `docs/constitution.md`: principios innegociables.
- `MEMORY.md`: decisiones vigentes y estado de cada spec.
- `DESIGN.md`: para cualquier cambio de UI.
- La spec activa en `specs/NNN-nombre/`.

## Flujo de trabajo
- Feature nueva → `/sdd <petición>` (coordinador → planner → implementer → reviewer).
- Cambio pequeño sin spec → `/feature <petición>`.
- Al terminar una sesión o una spec → `/log` (resumen breve en `ai-workspace/journal.md`).
- Commit y push → `/git-commit` (skill en `.claude/skills/git-commit/`): Conventional Commits en inglés, **siempre con la aprobación del usuario antes de tocar git**. Nunca hagas commit fuera de esta skill.

## Stack
- Monorepo con npm workspaces: `shared/` (lógica pura), `backend/` (Express + better-sqlite3 + Zod) y `frontend/` (React + Vite + TanStack Query).
- TypeScript estricto en todo el repositorio. Tests con Vitest.

## Estilo de código
- Capas del backend: `routes → controllers → services → repositories`. La lógica de negocio va en `shared/` o en `backend/src/domain/`.
- Archivos de menos de 200 líneas y funciones de menos de 40. Si crecen, se dividen.
- Nada de `any`. Las entradas externas se validan con Zod en el borde.
- Los importes se manejan siempre en **céntimos enteros**.
- La UI usa solo los tokens de `DESIGN.md`: nada de colores escritos a mano.
- No añadas dependencias sin justificarlo en el plan.

## Comandos
- `npm run dev`: levanta el backend y el frontend.
- `npm test`: todos los tests.
- `npm run lint`: ESLint y comprobación de tipos.
