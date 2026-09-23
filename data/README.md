# Estructura de datos del catálogo

`products.json` inicia vacío intencionalmente. En esta etapa no se agregan productos, precios, marcas, referencias, existencias ni especificaciones.

Cuando se carguen datos reales, cada producto podrá incluir como mínimo:

- `id`: identificador estable del producto.
- `name`: nombre comercial.
- `reference`: referencia o SKU real.
- `brand`: marca real, cuando exista.
- `category`: categoría real.
- `subcategory`: subcategoría real, cuando exista.
- `measurements`: medidas reales del producto.
- `presentations`: presentaciones reales disponibles.
- `prices`: precios reales, cuando sean suministrados.
- `availability`: disponibilidad informada.
- `images`: rutas de las imágenes asociadas al producto.

Los campos deberán completarse únicamente con información verificada. Las imágenes de cada producto se organizarán en `assets/images/products/`, sin mezclar referencias, medidas o tipos diferentes.
