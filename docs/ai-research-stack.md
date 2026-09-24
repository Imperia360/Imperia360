# Capa de IA para validacion masiva

## Flujo operativo

1. Fuentes de fabricantes, importadores, mayoristas, distribuidores y tiendas ferreteras.
2. Exa realiza descubrimiento semantico y localiza paginas de productos y catalogos.
3. Una capa de extraccion estructurada puede recuperar campos detallados cuando exista acceso autorizado.
4. El normalizador convierte presentaciones y unidades sin inventar conversiones no verificables.
5. La conciliacion identifica:
   - MATCH_EXACT
   - MATCH_EQUIVALENT
   - POSSIBLE_MATCH
   - NEEDS_REVIEW
   - DIFFERENT_PRODUCT
6. La validacion exige fuente, URL, fecha, nombre original, presentacion y precio verificable cuando aplique.
7. El historial conserva cambios de precio y evidencia.
8. Solo los registros aprobados pueden pasar posteriormente al catalogo maestro.

## Regla de no duplicacion

Los resultados descubiertos no modifican directamente `data/products.json`.
Las ofertas y evidencias permanecen separadas hasta completar la conciliacion.

## Fuentes prioritarias configuradas

Corbeta, Mundial de Tornillos, Roxvan, Sofalca, Tornillos y Herramientas 777, Tornillos y Tuercas Co., Tornillos Fercar y Coval.

## Exa

El repositorio incluye `.github/scripts/exa-discovery.mjs`.
Cuando `EXA_API_KEY` exista como secreto de GitHub Actions, el script consulta las busquedas configuradas en `data/catalog-sources.json` y guarda resultados en `data/exa-discovery.json`.

La salida de Exa es descubrimiento, no una confirmacion automática de precio. Una página sin precio verificable se mantiene como evidencia pendiente de validacion.

## Secretos externos

`EXA_API_KEY`
`APIFY_API_TOKEN`
`APIFY_ACTOR_ID`

No almacenar claves en el repositorio.