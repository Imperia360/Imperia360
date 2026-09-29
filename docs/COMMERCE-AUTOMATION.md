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


## Abastecimiento y utilidad

El backend valida el carrito contra el catálogo antes de generar el pago. Después puede preparar una ficha de abastecimiento mediante `POST /api/commerce?action=prepare-fulfillment`.

Para el producto `RO4396 / HT1238 / ref. 13604` se incorporó como evidencia de proveedor el precio público observado de Roxvan de **$2.428 COP por unidad para compras de 12+**, con verificación de stock y flete pendiente al momento de la orden. La fuente pública consultada muestra además precios de $3.398 para 1–2 unidades y $3.156 para 3–11. Esto es un costo observado, no una garantía de precio final. 

El sistema calcula:
- venta total al cliente;
- costo de proveedor observado;
- utilidad bruta antes del flete;
- proveedor y referencia;
- estado de stock pendiente de verificación;
- necesidad de cotizar el envío según destino.

El costo del proveedor nunca se muestra al cliente. El pedido al proveedor no se marca como automático hasta que exista una API/checkout de proveedor realmente conectado; mientras tanto queda como revisión de abastecimiento, evitando inventar stock, flete o una compra ya realizada.
