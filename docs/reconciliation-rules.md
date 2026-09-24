# Reconciliación segura del catálogo IMPERIA 360

## Flujo

`descubrimiento -> evidencia -> normalización -> matching -> revisión -> verificación -> publicación`

## Estados de matching

- `MATCH_EXACT`: referencia/SKU compatible con evidencia suficiente.
- `MATCH_EQUIVALENT`: alta similitud y características compatibles; no significa mismo SKU.
- `POSSIBLE_MATCH`: similitud parcial; requiere revisión humana.
- `NEEDS_REVIEW`: evidencia insuficiente, campos faltantes o ambigüedad.
- `DIFFERENT_PRODUCT`: producto confirmado como distinto; nunca fusionar.

## Reglas de seguridad

1. Un descubrimiento de Exa no es por sí mismo una oferta verificada.
2. Una URL encontrada no autoriza a inventar precio, presentación, stock, marca o referencia.
3. Precio ausente, cero o no verificable se conserva como desconocido/quote-only.
4. Las fuentes se conservan con URL y fecha de consulta.
5. El matching automático no modifica `data/products.json`.
6. `POSSIBLE_MATCH`, `NEEDS_REVIEW` y `DIFFERENT_PRODUCT` permanecen fuera de publicación automática.
7. Una presentación diferente solo puede tratarse como equivalente cuando la conversión está respaldada por datos verificables.
8. Los conteos históricos 692 y 792 se consideran fuentes protegidas de reconciliación, no productos activos.

## Archivos

- `data/market-offers.json`: evidencia/ofertas brutas normalizadas.
- `data/product-matches.json`: resultados de matching.
- `data/reconciliation-review.json`: cola de revisión.
- `data/validation-results.json`: auditoría final.
- `data/products.json`: única base maestra publicada.
