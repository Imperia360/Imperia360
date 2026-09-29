# IMPERIA 360 — Venta automática por WhatsApp y pago

## Arquitectura
- WhatsApp Cloud API recibe mensajes mediante webhook.
- El asistente busca primero en el catálogo maestro.
- Gemini redacta la respuesta usando únicamente la evidencia del catálogo.
- El backend crea un link Wompi de un solo uso con el valor exacto del carrito.
- El checkout de Wompi permite los métodos habilitados para el comercio, incluido PSE.
- El QR Bre-B actual queda como alternativa manual.

## Secretos del backend
META_ACCESS_TOKEN
META_PHONE_NUMBER_ID
META_VERIFY_TOKEN
GEMINI_API_KEY
WOMPI_PRIVATE_KEY
WOMPI_PUBLIC_KEY

Nunca poner estas claves en index.html ni en JavaScript público.

## Variables
CATALOG_URL = URL pública de data/products.json
SITE_URL = URL pública del sitio

## Flujo
Cliente → WhatsApp → webhook → búsqueda de catálogo → Gemini → producto/precio → cantidad/zona → link Wompi → pago → confirmación del estado.

GitHub Pages es estático y no puede recibir el webhook ni guardar claves privadas. El backend preparado está en workers/imperia-commerce-api.mjs.
