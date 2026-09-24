# IMPERIA 360 — Órdenes operativas de la flota IA

## ORDEN 01 — EXA / INVESTIGACIÓN

Objetivo: maximizar cobertura de fuentes colombianas.

Acciones obligatorias:
1. Investigar cada fuente activa en `data/catalog-sources.json`.
2. Ejecutar búsquedas separadas por categoría y por producto.
3. Priorizar fabricante/importador/mayorista sobre retail.
4. Capturar URL exacta de producto cuando exista.
5. No considerar un snippet como verificación de precio.
6. Registrar nombres, referencias y presentaciones literalmente.

## ORDEN 02 — CAPTURA / APIFY

Objetivo: convertir páginas descubiertas en evidencia estructurada.

Campos mínimos: fuente, URL, fecha, nombre original, marca, referencia, presentación, precio publicado, moneda, disponibilidad y evidencia.

Regla: dato no visible = `null`/desconocido; jamás inferir.

## ORDEN 03 — COPILOT / INGENIERÍA

Objetivo: mantener una aplicación estable y mantenible.

Acciones:
- revisar scripts y workflows;
- crear pruebas automatizadas;
- validar JSON y esquemas;
- mejorar búsqueda/filtros;
- detectar regresiones;
- trabajar en ramas/PR cuando haya cambios funcionales.

## ORDEN 04 — RECONCILIADOR IA

Objetivo: identificar correspondencias entre fuentes y catálogo.

Jerarquía:
1. referencia exacta;
2. SKU exacto;
3. fabricante + referencia;
4. marca + atributos técnicos;
5. nombre + medidas + presentación.

Nunca fusionar por nombre parecido únicamente.

## ORDEN 05 — AUDITOR IA

Objetivo: encontrar errores antes de publicar.

Buscar:
- duplicados;
- referencias contradictorias;
- marcas incompatibles;
- unidades distintas;
- precios cero/no verificables;
- productos sin fuente;
- productos sin fecha;
- equivalencias no demostradas.

## ORDEN 06 — TESTER IA

Objetivo: garantizar que cada modificación sea publicable técnicamente.

Validar JSON, esquema, IDs, enlaces, scripts, workflows, búsqueda, filtros y regresiones.

## ORDEN 07 — CHATGPT/CODEX / ORQUESTADOR

Objetivo: consolidar resultados y proteger las reglas maestras.

Debe resolver conflictos, mantener los estados de matching y decidir qué queda en revisión.

Nunca rellenar huecos con suposiciones.

## ORDEN 08 — DOCUMENTADOR

Mantener arquitectura, reglas, fuentes, decisiones, incidencias y cambios relevantes.

## ORDEN 09 — CALIDAD COMERCIAL

Revisar que el catálogo permita distinguir correctamente:
- unidad;
- paquete;
- caja;
- bulto;
- rollo;
- metro;
- kilogramo;
- juego;
- par;
- docena;
- presentaciones especiales.

No convertir presentaciones salvo que la equivalencia esté documentada.

## ORDEN 10 — SEGURIDAD DE PUBLICACIÓN

`data/products.json` es la única base maestra publicada.

Ningún agente debe escribir directamente productos nuevos allí como resultado de una búsqueda.

Estados automáticos permitidos: `MATCH_EXACT`, `MATCH_EQUIVALENT` cuando la evidencia cumple las reglas.

Estados que requieren revisión: `POSSIBLE_MATCH`, `NEEDS_REVIEW`, `DIFFERENT_PRODUCT`.

## ORDEN 11 — CRECIMIENTO

El objetivo no es alcanzar artificialmente un número de productos. El objetivo es conseguir el catálogo más amplio posible que sea verificable, deduplicado y comercialmente utilizable.

Los históricos 692 y 792 son fuentes de reconciliación protegidas.

## ORDEN 12 — DEFINITION OF DONE

Una referencia solo se considera terminada cuando tiene:
- identidad clara;
- categoría/subcategoría;
- presentación exacta;
- fuente;
- URL;
- fecha;
- evidencia suficiente;
- control de duplicados;
- estado de matching;
- precio verificable o `quote_only`;
- imagen verificada cuando esté disponible.
