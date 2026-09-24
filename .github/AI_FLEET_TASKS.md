# IMPERIA 360 — Tareas paralelas de IA

## Objetivo

Maximizar cobertura y velocidad sin sacrificar trazabilidad, deduplicación ni verificación.

## Carriles paralelos

### EXA — Investigación de mercado
- Corbeta.
- Mundial de Tornillos.
- Coval.
- Roxvan.
- Sofalca.
- Tornillos y Herramientas 777.
- Tornillos y Tuercas Co.
- Tornillos Fercar.
- Nuevos fabricantes/importadores detectados durante la investigación.
- Buscar por categoría, referencia, marca y presentación.

### APIFY — Captura estructurada
- Capturar páginas de producto descubiertas.
- Extraer nombre, referencia, marca, presentación, precio y URL cuando estén realmente visibles.
- No convertir texto de catálogo en precio verificado si la fuente no lo publica.

### COPILOT — Ingeniería
- Tests de esquemas.
- Mejoras de búsqueda/filtros.
- Validación de JSON.
- Mejoras de rendimiento.
- Correcciones de CI.
- Nunca editar directamente el catálogo comercial sin flujo de revisión.

### CHATGPT/CODEX — Orquestación
- Reconciliar resultados.
- Resolver conflictos.
- Mantener reglas maestras.
- Decidir qué evidencia es suficiente para cada estado.

### AUDITOR IA — Calidad
- Duplicados exactos.
- Duplicados por nombre + marca + medidas.
- Referencias contradictorias.
- Presentaciones inconsistentes.
- Precios cero, ausentes o sospechosos.
- Productos sin evidencia.

### TESTER IA — Regresión
- JSON válido.
- Esquemas.
- Conteos.
- Claves únicas.
- Integridad de referencias.
- Integridad del flujo de publicación.

### DOCUMENTADOR IA
- Mantener documentación de reglas.
- Registrar cambios de arquitectura.
- Mantener trazabilidad de las fuentes.

## Regla de publicación

Ningún agente publica directamente un producto nuevo en `data/products.json`.

Solo pueden avanzar automáticamente los casos que cumplan las reglas de reconciliación. Los ambiguos quedan en revisión.

## Prohibiciones

- Inventar precios.
- Inventar SKU/referencias.
- Inventar stock.
- Inventar equivalencias.
- Duplicar productos.
- Confundir presentación con producto.
- Convertir un resultado de buscador en una oferta verificada sin comprobar la fuente.


## LOTE PRIORITARIO ACTIVO — 2026-09-24

1. Auditoría: clasificar los 12 IDs duplicados y los 173 posibles duplicados; no borrar automáticamente.
2. Reconciliación: cruzar cada candidato con referencia, marca, medida y presentación.
3. Investigación: ampliar Corbeta, Mundial de Tornillos, Coval y las demás fuentes por categorías.
4. Precios: verificar públicamente solo precios sustentados; separar cotización de precio verificable.
5. Evidencia: conservar URL, fecha, fuente, nombre y presentación.
6. CI: ejecutar y corregir cada fallo antes de declarar el lote terminado.
7. Publicación: incorporar únicamente candidatos que superen las reglas; nunca sobreescribir el maestro de forma insegura.
8. Reporte: entregar métricas del lote y dejar explícito todo lo que requiera revisión humana.
