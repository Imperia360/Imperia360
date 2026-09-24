# IMPERIA 360 — Reconciliación histórica del catálogo
Fecha: 2026-09-24

## Resultado de la auditoría

Se revisó la base maestra actual del repositorio `data/products.json` y se contrastó contra el archivo histórico disponible en Library `IMPERIA_360_Plan_Maestro_Puntos_1_al_12.xlsx`.

### Base actual del repositorio
- Registros actuales: **466**
- Estado de los 466: **review**
- Categorías con registros actuales: **25**
- El catálogo actual contiene **51 registros Gerfor**, por lo que las 51 referencias Gerfor mencionadas históricamente no deben sumarse automáticamente.

### Fuente histórica recuperada
- Archivo: `IMPERIA_360_Plan_Maestro_Puntos_1_al_12.xlsx`
- Hoja: `01_Catalogo_692`
- Filas de productos: **692**
- Nombres normalizados únicos: **673**
- Grupos con nombre normalizado repetido: **19**
- Categorías históricas: **29**

Las repeticiones de nombre no se eliminan automáticamente: pueden corresponder a presentaciones, referencias o variantes distintas y deben verificarse antes de fusionar.

### Diferencia de volumen
La fuente histórica contiene **226 filas más** que la base actual (692 frente a 466). Esta diferencia **no se interpreta como 226 productos nuevos**: todavía falta cruzar referencia/SKU, marca, medidas, presentación, fuente y demás claves de deduplicación.

### Estado de los 792 históricos
Se revisaron los archivos disponibles en Library y el contexto recuperable. **No se encontró una lista/archivo de 792 referencias identificables** que permita hacer una reconciliación registro por registro.

Por tanto:
- No se agregan 792 referencias por conteo.
- No se suman las 51 Gerfor históricas por separado.
- No se inventan equivalencias.
- El número 792 queda como conjunto histórico pendiente de recuperación documental.

## Auditoría de calidad de los 466 actuales

En la base actual:
- 466/466 están en estado `review`.
- 350 tienen precio fuente marcado como validado.
- 116 están como `quote_only`.
- 466/466 tienen imagen pendiente.
- 466/466 tienen pendiente el precio IMPERIA 360.
- 414 presentan `pending_cross_source` en el control de duplicados y requieren revisión antes de declarar el catálogo definitivo.
- 62 presentan ausencia de SKU/referencia según el control de calidad.

## Decisión de control

La fuente histórica de 692 queda registrada como **fuente recuperada para reconciliación**, pero **no se incorporan automáticamente sus 692 filas**.

La única base publicable sigue siendo `data/products.json`, actualmente con 466 registros, hasta completar:
1. cruce histórico 692 ↔ 466;
2. recuperación documental del conjunto 792;
3. deduplicación por SKU/referencia/marca/medidas/presentación/fuente;
4. verificación comercial;
5. precios y margen;
6. imágenes exactas.

## Próximo paso

El siguiente trabajo debe ser el cruce detallado de los 692 históricos contra los 466 actuales y la clasificación de cada histórico como:
- ya incluido;
- candidato a nueva referencia;
- duplicado;
- variante/presentación;
- requiere verificación;
- fuente insuficiente.

**No se publica todavía.**
