# IMPERIA 360 — Reconciliación y unificación del catálogo
Fecha: 2026-09-24

## Resultado final de esta etapa

### Base maestra
- Base inicial auditada: 466 registros.
- Duplicado exacto detectado y eliminado: 1 registro.
- Registro conservado: `imp-0186`.
- Registro eliminado: `imp-0061`.
- Ambos correspondían al mismo producto Roxvan: **Toma aéreo industrial Kontiki polo/tierra 15A RETIE**.
- Precio público validado: **$9.401 COP**.
- Precio mayorista disponible: **$7.900 COP**.
- No se promediaron precios entre registros cuando representaban la misma fuente y el mismo producto; se conservó el dato comercial más completo.

**Base maestra resultante: 465 registros.**

## Control de duplicidades

Sobre los 465 registros finales:
- SKU duplicado: 0 grupos.
- Referencia de fabricante duplicada: 0 grupos.
- Referencia de proveedor duplicada: 0 grupos.
- Duplicidad por nombre + medidas/presentación: 0 grupos.
- Queda 1 caso de nombre similar/idéntico que fue unificado porque era el mismo producto, misma fuente y mismo precio público.

## Reconciliación de los 692 históricos

La hoja `01_Catalogo_692` contiene 692 filas de catálogo base distribuidas en 29 bloques.

La revisión muestra:
- 673 nombres normalizados únicos.
- 20 grupos con nombres repetidos.
- Las filas históricas son principalmente **productos base/tipos de producto**, con presentaciones sugeridas genéricas.
- No traen una referencia/SKU verificable por cada fila.
- La hoja `04_Precios` contiene 692 filas, pero los campos de costo/precio aparecen pendientes, por lo que **no existe una base histórica suficiente para calcular un precio de mercado por producto**.

Por esta razón, las 692 filas **no se agregan a la base maestra como productos nuevos**. Se conservan como fuente de cobertura del catálogo y guía para las próximas búsquedas de referencias reales.

## Promedio de precios

Para evitar un promedio comercial engañoso, se separaron dos conceptos:

1. **Promedio estadístico del conjunto actual con precio público validado:** 350 registros con precio público, promedio aritmético de **$61.678 COP**.
2. **Promedio estadístico del conjunto actual con precio mayorista validado:** 288 registros, promedio aritmético de **$62.768 COP**.

Estos promedios **no son precios de mercado recomendados** ni deben aplicarse a productos individuales, porque mezclan categorías, marcas, tamaños y presentaciones diferentes. Para cada referencia nueva se deberá calcular el precio usando fuentes comparables y la misma presentación.

## Regla para continuar

A partir de esta etapa:
- No se agregan productos solo por nombre genérico.
- No se duplica una referencia por cambiar tamaño, salvo que exista una referencia comercial distinta que corresponda realmente a ese tamaño.
- No se mezclan unidad, paquete, caja, rollo o kilogramo en un mismo promedio.
- Cuando existan varios precios verificables para la misma referencia y presentación, se podrá calcular un promedio de mercado específico para esa referencia.
- Cuando solo exista una fuente, se conserva como precio fuente, no como promedio de mercado.
- Cuando no exista precio verificable, queda `quote_only`.
- No se publica ningún precio IMPERIA definitivo sin validar costo, IVA aplicable, logística y margen.

## Estado

La reconciliación de la fuente de 692 queda **cerrada para esta etapa**: no se incorporan filas genéricas como falsos productos.

La base maestra única queda en **465 productos verificables**, lista para continuar con la incorporación de nuevas referencias reales.

El conjunto histórico de 792 referencias continúa sin incorporarse porque no existe una lista documental recuperable que permita identificar y deduplicar cada referencia individualmente.
