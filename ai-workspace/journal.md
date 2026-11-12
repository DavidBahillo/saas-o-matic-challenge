# Journal — sesiones de desarrollo con IA

Una entrada breve por sesión o spec. Se genera con `/log`.

## 2026-11-12 · Análisis del reto y andamiaje del proceso
- **Objetivo:** entender el enunciado y montar el sistema de trabajo antes de escribir código.
- **Prompt clave:** > "lee el documento Prueba Devs con IA y dame un plan para realizarlo"
- **Segundo prompt clave:** > "Quiero un sistema multiagente para las specs… basado en el curso… y un design.md propio con modo oscuro por defecto"
- **La IA propuso → yo decidí:** plan con un stack Node/React → pedí añadir el guardado autodocumentado, el multiagente del curso y un DESIGN.md propio. El coordinador pasa a ser `/sdd`, porque en Claude Code los subagentes no anidan.
- **Resultado:** CLAUDE.md, constitución, MEMORY.md, DESIGN.md, 3 subagentes, comandos /sdd /feature /log, y hook de prompts.
- **Aprendizaje:** primero el arnés (reglas, agentes y registro) y después el código.
