# Entrenador Personal – PWA v0.5.2

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
