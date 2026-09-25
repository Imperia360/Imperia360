# IMPERIA 360 — Directrices operativas
Fecha: 2026-09-25

## 1. Objetivo
Construir un catálogo comercial verificable y rentable para IMPERIA 360, priorizando productos que puedan venderse en Colombia y, especialmente, Bogotá.

## 2. Fuente única y control de publicación
- Mantener una única base maestra.
- No inventar precios, referencias, marcas, presentaciones, disponibilidad ni imágenes.
- No convertir un candidato de investigación en producto público automáticamente.
- Todo candidato nuevo debe conservar fuente, URL, fecha de consulta, nombre original, referencia/SKU, marca, presentación/unidad y precio publicado cuando exista.
- Si falta un dato crítico, conservar el registro como NEEDS_REVIEW/quote_only/not_found según corresponda.
- No presentar inventario de proveedores como inventario propio de IMPERIA.
- No fusionar variantes que cambien marca, referencia, medida, calibre, tamaño, presentación o unidad.

## 3. Investigación de mercado
Prioridad de investigación:
1. Tornillería, tuercas, arandelas, chazos, puntillas y fijaciones.
2. Material eléctrico: cables, cinta aislante, tomas, interruptores, breakers y accesorios.
3. PVC/plomería: tubería, accesorios, canaletas, válvulas, llaves y grifería.
4. Pinturas y complementos: tipos 1/2/3, esmaltes, tráfico, brochas, rodillos y pinceles.
5. Cementos, morteros y materiales de construcción.
6. Herramientas, seguridad, soldadura, cerrajería, jardín, limpieza, automotriz, bombas y maquinaria.

Fuentes con precio público deben preferirse sobre páginas que solo indiquen "cotizar". Los resultados de Exa son descubrimiento y deben validarse antes de publicación.

## 4. Precios y rentabilidad
- El precio de otra tienda es referencia de mercado, no costo de adquisición de IMPERIA.
- Calcular precio IMPERIA únicamente cuando exista un costo/fuente comercial suficientemente sustentado.
- Mantener separadas las capas: costo, gastos aplicables, margen objetivo, precio minorista y precio mayorista.
- Cuando corresponda, preparar escalas por unidad, 100, 500, 1000 y peso/presentación.
- Nunca fabricar un costo para hacer cuadrar un margen.

## 5. Imágenes
- Usar imagen que corresponda al producto y variante exactos.
- No rellenar imágenes faltantes con imágenes genéricas de otro producto.
- Registrar fuente de imagen cuando sea posible.
- Producto sin imagen exacta permanece fuera de publicación si la interfaz exige imagen.

## 6. Auditoría
Antes de publicar:
- identidad completa;
- referencia/variante;
- precio público verificable;
- fuente y URL;
- presentación/unidad;
- imagen exacta;
- ausencia de duplicado;
- regla de precio/margen cumplida.

## 7. GitHub / automatización
- Exa API se consume mediante EXA_API_KEY en Secrets de GitHub; nunca guardar la clave en código.
- Mantener la validación final funcionando.
- La publicación automática debe permanecer protegida por la puerta de validación.
- Reportar errores de workflow antes de considerar una corrida terminada.
- Revisar duplicados exactos y posibles duplicados semánticos sin fusionar variantes legítimas.

## 8. Marketing
- Mantener contenido orgánico útil y no spam.
- Usar Metricool para programación y análisis.
- Revisar duplicados antes de añadir nuevas publicaciones.
- Priorizar contenido de producto, necesidades reales, educación, comparación de usos y llamadas a cotización.
- No afirmar disponibilidad o precios que no hayan sido verificados.
- SEO debe apuntar a categorías y necesidades reales de búsqueda en Colombia/Bogotá.

## 9. Estado de referencia al 2026-09-25
- Auditoría del catálogo: 476 productos, 0 issues, 0 IDs duplicados y 0 posibles duplicados en el archivo auditado.
- El proceso de validación de mercado conserva candidatos en revisión y tiene publicación automática desactivada.
- El repositorio puede mostrar un conteo maestro diferente al archivo de auditoría; esos conteos no deben mezclarse sin reconciliación.
- Metricool: marca IMPERIA 360 conectada a Facebook, Instagram y TikTok, zona horaria America/Bogota.
