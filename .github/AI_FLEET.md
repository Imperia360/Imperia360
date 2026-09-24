# IMPERIA 360 — Flota paralela de IA

## Objetivo

Mantener varios agentes trabajando sobre tareas independientes sin permitir que ninguno escriba directamente sobre el catálogo maestro sin validación.

## Agentes y responsabilidades

### 1. ORQUESTADOR — ChatGPT/Codex
Responsabilidad:
- Mantener las reglas maestras del proyecto.
- Dividir trabajo.
- Resolver conflictos entre resultados.
- Aprobar qué resultados pasan a revisión o publicación.
- Nunca inventar datos.

### 2. INVESTIGADOR — Exa
Responsabilidad:
- Descubrir fabricantes, importadores, mayoristas y catálogos.
- Encontrar páginas de producto.
- Localizar referencias, presentaciones y precios publicados.
- Guardar evidencia y URL.
Salida: data/exa-discovery.json

### 3. DESARROLLADOR — GitHub Copilot
Responsabilidad:
- Implementar funcionalidades.
- Crear y corregir scripts.
- Ejecutar pruebas.
- Revisar PR.
- Trabajar en ramas aisladas para evitar conflictos.

### 4. RECONCILIADOR — IA de matching
Responsabilidad:
- Comparar descubrimientos contra data/products.json.
- Detectar exactos, equivalentes, posibles coincidencias y productos diferentes.
- No fusionar variantes con medidas, marcas, referencias o presentaciones distintas.

### 5. AUDITOR — agente de calidad
Responsabilidad:
- Detectar duplicados.
- Detectar campos faltantes.
- Detectar precios imposibles o no verificables.
- Detectar referencias contradictorias.
- Generar NEEDS_REVIEW sin alterar el maestro.

### 6. TESTER — agente de CI
Responsabilidad:
- Validar JSON/schema.
- Probar normalización.
- Probar deduplicación.
- Probar búsqueda y filtros del sitio.
- Informar regresiones.

### 7. DOCUMENTADOR — agente de mantenimiento
Responsabilidad:
- Mantener documentación, changelog y controles de calidad.
- No modificar datos comerciales.

## Paralelización

Los agentes 2, 3, 5, 6 y 7 pueden trabajar simultáneamente cuando no dependan entre sí.

El reconciliador trabaja después de recibir descubrimientos.

El orquestador decide qué resultados pueden avanzar.

## Regla crítica

Ningún agente puede publicar directamente en data/products.json.

Flujo:

fuentes
-> descubrimiento
-> evidencia
-> extracción
-> normalización
-> matching
-> auditoría
-> revisión
-> publicación

## Historial

Toda incorporación debe conservar fuente, URL, fecha de consulta y referencia original cuando exista.

## Conteos protegidos

No sumar automáticamente los históricos 692/792 a los productos activos. Primero deben reconciliarse y verificarse.

## Seguridad

Las claves API solamente deben existir como secretos de GitHub Actions. Nunca deben escribirse en archivos del repositorio.

## Estado de mando
La flota opera bajo órdenes continuas documentadas en `.github/AI_OPERATING_ORDERS.md` y `.github/AI_FLEET_TASKS.md`. Cada agente debe producir evidencia verificable y respetar el bloqueo de publicación sobre `data/products.json`.
