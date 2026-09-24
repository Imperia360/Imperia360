# Validacion masiva de mercado

## Objetivo
Unificar en una sola base los productos del catalogo IMPERIA 360 y las ofertas encontradas en fabricantes, importadores, mayoristas, distribuidores y ferreterias, sin duplicar productos ni inventar precios.

## Flujo
1. Recoleccion desde fuentes autorizadas.
2. Conservacion del dato crudo y su fuente.
3. Normalizacion de nombre, marca, referencia, medidas y presentacion.
4. Conciliacion contra `data/products.json`.
5. Clasificacion: MATCH_EXACT, MATCH_EQUIVALENT, POSSIBLE_MATCH, NEEDS_REVIEW o DIFFERENT_PRODUCT.
6. Normalizacion de presentaciones y unidades.
7. Calculo de equivalencias solamente cuando existe un factor de conversion verificable.
8. Validacion del precio y fecha.
9. Historial de precios sin sobrescribir observaciones anteriores.
10. Publicacion solo de registros que cumplen las reglas de calidad.

## Regla principal
Los productos existentes en la base maestra nunca se duplican. Una nueva fuente agrega una oferta o una observacion al producto maestro.

## Precios
Nunca se inventan precios. Si la fuente no publica un precio verificable, se registra `quote_only`. Un precio cero se trata como dato que requiere revision.

## Presentaciones
Se conserva la presentacion original y, cuando sea posible, se calcula un equivalente: unidad, 100, 500, 1000, kg, metro, etc. No se mezclan unidades incompatibles.

## Automatizacion
El workflow `.github/workflows/market-validation.yml` esta preparado para recibir un dataset normalizado de un recolector externo. El token de scraping no se guarda en el codigo; debe configurarse como secreto de GitHub.

## Alcance inicial
Las fuentes prioritarias incluyen Corbeta y Mundial de Tornillos, junto con las fuentes ya registradas en `data/catalog-sources.json`. Se pueden incorporar mas proveedores sin cambiar el modelo.
