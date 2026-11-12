# Prompt library — prompts reutilizables

Prompts que funcionaron, con el motivo. Se curan con `/log`.

## Planificación
**Plan a partir de un enunciado**
> "Lee el documento <ruta> y dame un plan para realizarlo."

*Por qué funciona:* corto, pero en modo plan obliga a leer y estructurar antes de tocar nada.

**Arrancar una feature con SDD**
> "/sdd Alta de cliente corporativo con validación estricta de DNI/NIE/CIF cuando el país es España. Errores 400 con código legible."

*Por qué funciona:* da el qué y la restricción clave, y deja el cómo al planner y las aprobaciones al usuario.

## Revisión y QA
**Revisión en paralelo con focos distintos**
> "Lanza en paralelo tres reviewer sobre la spec 002: (1) constitución y céntimos, (2) UI contra DESIGN.md con vista móvil, (3) qué RF cubren los tests y cuáles no. Junta los resultados en un único informe sin duplicados con un veredicto final."

*Por qué funciona:* cada revisor tiene un contexto pequeño y enfocado, y el coordinador elimina el ruido.

## Implementación
**TDD estricto en una tarea**
> "Implementa solo T3 de specs/002-tiered-pricing/tasks.md. Primero los tests de los límites 0, 10, 11, 50 y 51 en rojo; después el código. Para cuando estén en verde."

*Por qué funciona:* acota el alcance y define qué significa "hecho".

## Git
**Commit con aprobación humana**
> "/git-commit"

*Por qué funciona:* la skill fija el formato (Conventional Commits) y una parada obligatoria antes de tocar git, así que la IA propone y la persona decide.

## Corrección
**Rechazar una solución subóptima**
> "No aceptes floats para importes: rehaz el cálculo en céntimos enteros según la constitución (principio 2) y añade un test que falle con 0.1 + 0.2."

*Por qué funciona:* cita la regla concreta y pide una prueba que demuestre el fallo.
