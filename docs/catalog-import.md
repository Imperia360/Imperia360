# Importación futura del catálogo IMPERIA 360

Este documento define el proceso para incorporar datos reales. No contiene productos, referencias, SKU, marcas, precios, existencias ni imágenes.

## Alcance

La carga se realizará por lotes, comenzando por tornillería y fijaciones. Ningún módulo de esta etapa se conecta a `index.html` ni modifica automáticamente `data/products.json`.

## Flujo recomendado

1. Recibir datos desde una fuente real identificada.
2. Conservar el valor original cuando una normalización pueda alterar su significado.
3. Validar la estructura con `data/catalog-import.schema.json` y `js/catalog-validator.js`.
4. Revisar SKU y referencias con `js/catalog-duplicates.js`.
5. Validar rutas de imágenes con `js/catalog-images-validator.js` cuando existan imágenes autorizadas.
6. Registrar observaciones de precio con `js/catalog-pricing-validator.js`, sin calcular ni modificar precios.
7. Generar un informe con `js/catalog-import-report.js`.
8. Revisar manualmente antes de incorporar o publicar registros.

## Datos faltantes

Usar `null` para valores individuales desconocidos y `[]` para listas sin elementos. Los datos no confirmados no deben reemplazarse por suposiciones.

Estados de trabajo permitidos:

- `pending_verification`
- `verified`
- `possible_duplicate`
- `duplicate`
- `incomplete`

Estos estados son informativos. Una regla que dependa de una decisión comercial futura debe documentarse y no bloquear por sí sola un registro.

## Precios

El validador solo conserva observaciones provenientes de fuentes reales: precio publicado, precio anterior cuando exista, moneda, presentación, fuente, URL o referencia de fuente, fecha de consulta y estado de validación.

No calcula precios de IMPERIA 360, márgenes, descuentos ni recomendaciones comerciales. Un precio desconocido no se convierte automáticamente en cero. Las decisiones de publicación o precio comercial se definirán posteriormente.

## Duplicados

Las coincidencias por SKU, referencia, nombre, marca, medidas, presentación o unidad de venta son candidatos para revisión. No se eliminan ni fusionan registros automáticamente.

## Categorías preliminares

Las subcategorías de tornillería y fijaciones son líneas de investigación. No se convierten automáticamente en categorías definitivas ni se asignan a productos sin validación real.
