# Servidor del entrenador integrado

Este Worker mantiene la clave de OpenAI fuera de la PWA pública y expone dos rutas:

- `GET /health`: comprobación del servicio.
- `POST /coach`: interpreta check-in, notas de fisio, restricciones e historial y devuelve una sesión estructurada.

## Secretos y despliegue

No guardes nunca la clave en GitHub ni en `wrangler.jsonc`. Configúrala como secreto `OPENAI_API_KEY` dentro de Cloudflare Workers. El dominio permitido está limitado a `https://pablo-morrondo.github.io`.

La app solo se conectará a este servicio cuando la URL desplegada esté configurada. Los cambios clínicos extraídos de texto libre siempre requieren confirmación del usuario antes de modificar permisos o restricciones.
