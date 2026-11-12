# Constitución de SaaS-O-Matic

Principios innegociables. Si una spec o un plan los contradice, gana la constitución, salvo que se modifique aquí primero.

1. **Spec antes que código.** Ninguna feature se implementa sin `spec.md` aprobada por el usuario.
2. **Precisión monetaria.** Todo importe se calcula y se guarda en céntimos enteros. El redondeo solo se aplica al IVA (half-up, a céntimo) y la conversión de divisa ocurre únicamente en la capa de presentación.
3. **Una sola fuente de verdad.** El cálculo de tramos e IVA vive en `shared/` y lo importan tanto el backend como el frontend. El backend siempre recalcula y nunca confía en un total que envíe el cliente.
4. **Validación estricta en el borde.** Toda entrada HTTP se valida con Zod. Si el país es España, el identificador fiscal tiene que pasar el algoritmo oficial (DNI, NIE o CIF); en otro caso, la respuesta es 400 con un código de error legible.
5. **Lógica pura y testeada.** Las funciones de dominio no tienen efectos secundarios y se escriben con TDD: primero el test en rojo, luego el código.
6. **Capas limpias.** Las rutas no contienen lógica, los repositorios no contienen reglas de negocio y el SQL solo vive en los repositorios.
7. **Archivos pequeños.** Menos de 200 líneas por archivo y menos de 40 por función.
8. **Errores explícitos.** La API responde `{ error: { code, message, details? } }` con 400, 404, 409 o 500. El frontend muestra siempre estados de carga, error y vacío.
9. **Diseño consistente.** La UI sigue `DESIGN.md`: modo oscuro por defecto, contraste AA y responsive desde 360 px.
10. **Trazabilidad.** Toda decisión relevante queda en `MEMORY.md` y cada sesión en `ai-workspace/journal.md`.
