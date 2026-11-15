# Auditoría de diseño UI — HECHO en la 010 (2026-11-14)

Estado: HECHO en la spec 010 (`specs/010-ui-design-audit/`); pendiente de validación del reviewer. Se conserva como registro del origen. Todo cambio de color, solo vía tokens de `DESIGN.md` / `tokens.css`.

## A. Tema claro (tokens)
1. Fondo (`--color-bg` o equivalente) más oscuro: `#E9E9E9`. Hoy demasiado blanco y con poco contraste entre variables.
2. Color de borde más oscuro para que tenga contraste suficiente sobre el nuevo fondo.
3. `sage` más potente: más claro y saturado. Comprobar requisitos de accesibilidad (solo lleva texto oscuro encima: contraste ≥ 4,5:1 para texto normal, 3:1 para texto grande/no texto) e informar de limitaciones.
4. `info` y azules del gráfico (chart): aclararlos, hacia tonos pastel/neón. Hoy demasiado oscuros. Revisar también contraste.
5. Línea de elevación bajo el botón luna/sol: en oscuro es blanca y funciona; en claro sigue blanca y no se ve. Crear el equivalente para el tema claro a partir de los valores del oscuro.

## B. Lista de clientes
6. Los dos botones de acción por fila sin fondo → `background-color: var(<color de fondo>)`.
7. Paginación: los botones no activos también con fondo sutil visible.
8. Paginación: gap de `--space-xs` a `--space-md` como mínimo (Anterior, 1, 2, Siguiente).
9. Columna "Simulaciones": solo el número; la palabra solo en la cabecera.
10. Separar "País" y "NIF" en dos columnas.
11. Color asociado a cada plan (starter, growth, enterprise), sutil sobre el fondo pero fácil de distinguir.

## C. Header
12. Sustituir la flecha del desplegable del header por el icono de flecha del desplegable de "Simulaciones guardadas" (consistencia).
13. Botón modo claro/oscuro: ver punto 5.

## D. Detalle de cliente
14. Plan al lado del nombre (no al final).
15. Debajo, datos: país, NIF, email y fecha, cada uno con icono.
16. Botón "Modo presentación Alt-P" → texto "Presentar"; "Alt-P" en tooltip (bocadillo) al hover/foco.
17. "Simulaciones guardadas": quitar el subtítulo "N simulaciones" y poner el número entre paréntesis junto al título.
18. Tabla de simulaciones guardadas: despliegue/pliegue animado (smooth) y flecha que gira (no se intercambia). Respetar `prefers-reduced-motion`.
19. Gráfico de tramos: transición suave al cambiar el número de usuarios.
20. Botón "Guardar simulación" → "Guardar" con icono.
21. Comprobar si la API de divisas (open.er-api.com) da el símbolo de cada divisa; solo si lo da, mostrarlo. Si no, no añadir otra fuente.

## E. Formularios Nuevo cliente y Editar cliente (aplica a ambos)
22. Formulario dentro de una tarjeta, centrado en pantalla (no en un lateral).
23. Quitar los subtítulos "Empresa", "Contacto" y "Plan".
24. Flechas de los selects → mismo icono de flecha del punto 12.
25. "Crear cliente" y "Guardar cambios" → "Guardar" con icono.
