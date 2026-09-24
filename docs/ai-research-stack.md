# Capa de IA para validacion masiva

## Motores
- Exa: descubrimiento y busqueda web orientada a agentes, cuando la conexion este activa.
- Apify: recoleccion estructurada y automatizada mediante API/Actors, conectado fuera de GitHub mediante secretos.
- IA de conciliacion: normalizacion, deteccion de equivalencias y control de duplicados.
- GitHub Actions: orquestacion, validacion y versionado.

## Regla de integracion
Ningun motor externo publica directamente en products.json. Todos entregan datos a market-offers.json; despues pasan por normalizacion, conciliacion y validacion.

## Variables/secretos esperados
EXA_API_KEY
APIFY_API_TOKEN
APIFY_ACTOR_ID

No guardar claves en el repositorio.

## Flujo
fuentes -> Exa (descubrimiento) -> Apify (extraccion) -> normalizador -> conciliador IA -> validacion -> historial -> catalogo.

## Calidad
No inventar precios, referencias o equivalencias. Conservar URL y fecha. Los casos ambiguos quedan para revision.
