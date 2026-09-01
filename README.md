# Entrenador Personal – PWA v0.7.4

## Entrenamiento real del 01/09/2026 en v0.7.4

- Migración idempotente que añade una sola vez el entrenamiento real completado del 1 de septiembre.
- El registro sustituye únicamente cualquier propuesta o sesión activa de esa fecha y elimina su propuesta de Inicio.
- Historial, Progreso y Calendario comparten una única actividad reconciliada para esa sesión.
- Se preservan todos los demás entrenamientos y datos locales, incluidos los del 27, 28 y 31 de agosto.

## Integridad de entrenamientos en v0.7.3

- Una sesión completada deja de mostrarse como propuesta o entrenamiento en curso en Inicio.
- Los botones de Inicio solo eliminan propuestas o sesiones `in_progress`; una sesión `completed` queda protegida.
- La reconciliación conserva una sola actividad por entrenamiento en Historial, Progreso y Calendario.
- Migración idempotente de la sesión real del 31/08/2026, sin modificar los registros históricos del 27 y 28 de agosto.
- Se mantienen las claves locales existentes; la actualización no limpia el historial ni los datos diarios.

## Historial y entrenador en v0.5.8

- Migración idempotente de la sesión real del 28/08/2026: 20 minutos de bicicleta estática, extensión de cuádriceps, curl femoral, abductores, aductores, core y rehabilitación.
- Las repeticiones no registradas de femoral, abductores y aductores permanecen vacías.
- La falta de autorización explícita ya no se interpreta como prohibición automática; las restricciones explícitas y señales rojas siguen teniendo prioridad.
- Las actividades realizadas y bien toleradas, incluida la bicicleta estática, se consideran disponibles y se ajustan según la respuesta a 24 horas.
- El entrenador usa el historial reciente para variar ejercicios y grupos musculares en lugar de repetir la misma plantilla.

## Historial unificado en v0.5.4

- Cada entrenamiento aparece una sola vez, con duración y ejercicios completados.
- Un único editor permite cambiar nombre, fecha, duración, pesos, repeticiones y estado de todas las series.
- Eliminar una sesión borra conjuntamente su ficha y su actividad asociada.
- El calendario muestra el nombre real de la sesión y el resumen de ejercicios.
- Corregida la versión visible duplicada (`v0.5.3.3`).

## Corrección de v0.5.3

- Progreso y Calendario recargan sus datos inmediatamente después de recuperar una sesión manual.
- La sesión ya importada por v0.5.2 se sincroniza automáticamente al abrir esta versión.

## Novedades de v0.5.2

- Nueva opción **Recuperar / añadir sesión manual** en Historial.
- Formulario para fecha, nombre, duración y ejercicios con pesos, repeticiones y estado realizado/no realizado.
- La sesión recuperada se guarda en el formato de v0.5: sigue siendo editable y cuenta en Progreso.
- Migración idempotente que precarga una sola vez la sesión real del 27/08/2026, con 20 minutos de bici, fuerza, core y rehabilitación.
- Las elevaciones de gemelo bilaterales se conservan expresamente como no realizadas.

## Verificación

1. Abre **Historial** y comprueba la tarjeta “Sesión real recuperada” del 27/08/2026.
2. Pulsa **Editar series** para cambiar pesos, repeticiones o estados.
3. En **Progreso**, los 20 minutos de bici se suman al acumulado.
4. Pulsa **Recuperar / añadir sesión manual** para crear otra sesión sin sustituir el historial existente.

Para actualizar: sustituye los archivos del repositorio de GitHub por los de este paquete. GitHub Pages desplegará la nueva versión automáticamente.
