# ORDEN MAESTRA DE TRABAJO — IMPERIA 360
Fecha: 2026-09-25

## Misión permanente
Ampliar y depurar el catálogo de IMPERIA 360 con datos comerciales verificables, mejorar la presencia digital y detectar oportunidades comerciales, sin inventar información.

## Regla de continuidad
Los frentes trabajan de forma continua cuando las herramientas y conexiones disponibles lo permiten. Cada frente debe dejar evidencia en GitHub, una fuente verificable o una acción confirmada. Nunca declarar una tarea como hecha por intención.

## Frente A — GitHub / ingeniería
- Mantener una sola base maestra.
- Ejecutar validaciones automáticamente.
- Corregir fallos técnicos del pipeline.
- Nunca saltar la puerta de publicación.
- Registrar cada cambio con commit descriptivo.
- Separar errores técnicos de problemas de datos.
- Reconciliar primero la diferencia entre los 488 registros declarados por control y los 476 productos de la auditoría vigente.
- No aumentar el contador activo con candidatos que estén en revisión.

## Frente B — Exa / inteligencia de mercado
- Investigar continuamente proveedores, mayoristas y tiendas con precios públicos.
- Priorizar Colombia y Bogotá.
- Prioridad: eléctrico, tornillería/fijaciones, PVC/plomería, pintura, construcción, herramientas, seguridad, soldadura, cerrajería, jardín, limpieza, automotriz, bombas y maquinaria.
- Registrar fuente, URL, fecha, marca, referencia, medida, presentación, unidad y precio.
- Buscar escalas unidad/100/500/1000 o por peso cuando la fuente las publique.
- No convertir precio minorista de un competidor en costo IMPERIA.
- No inventar costos, stock, referencias, imágenes ni disponibilidad.
- Candidatos ambiguos permanecen en revisión.
- Validar la variante exacta antes de pasar una evidencia de mercado a un registro publicable.

## Frente C — Auditoría de catálogo
- Detectar duplicados exactos y semánticos.
- Mantener separadas variantes por marca, referencia, medida, calibre, tamaño, presentación y unidad.
- Detectar productos sin imagen exacta, precio o referencia.
- No publicar registros incompletos.
- Priorizar productos con identidad, fuente y precio verificables.
- Auditar imágenes contra la referencia exacta; no usar imágenes genéricas para rellenar faltantes.

## Frente D — Precios y rentabilidad
- Separar costo de adquisición, IVA aplicable, logística/flete, medios de pago y otros gastos sustentados.
- Calcular precio minorista y precios por volumen únicamente cuando exista costo de adquisición fiable.
- Mantener escalas unidad/100/500/1000 o peso cuando sean comercialmente pertinentes y exista evidencia.
- Comparar contra mercado como referencia, no como costo.
- Si no existe costo fiable: marcar cotización/revisión; no inventar margen.

## Frente E — Web/SEO
- Mantener categorías, necesidades y productos indexables.
- Mejorar títulos, descripciones, datos estructurados y enlaces internos sin afirmaciones comerciales no verificadas.
- Mantener la página visualmente completa.
- Producto sin imagen/precio validado no debe aparentar estar disponible.
- Verificar periódicamente que GitHub Pages publique la rama correcta y que los cambios lleguen al sitio.

## Frente F — Metricool / contenido orgánico
- Facebook, Instagram y TikTok están conectados.
- Analizar rendimiento y mejores horarios antes de añadir publicaciones.
- Evitar duplicados, saturación y contenido repetido.
- Crear contenido útil: productos, usos, problemas que resuelve, mantenimiento, seguridad y ofertas solo cuando el precio esté verificado.
- No spam ni afirmaciones falsas.
- Si una acción de publicación/eliminación no está disponible mediante el conector, no fingir que fue ejecutada.

## Frente G — B2B
- Investigar empresas, conjuntos residenciales, administraciones, contratistas y comercios que puedan requerir ferretería.
- Registrar prospectos públicos de forma lícita.
- No enviar campañas masivas no autorizadas.
- Apollo queda pendiente mientras no exista conexión válida.
- No asumir que Claude, Copilot u otra IA externa está conectada si el conector no lo confirma.

## Frente H — Imágenes y ficha comercial
- Para cada candidato: identificar imagen exacta de fuente confiable, referencia y presentación.
- Registrar URL de imagen y página fuente.
- Solo marcar imagen como verificada cuando la asociación producto-imagen esté comprobada.
- Mantener imágenes separadas por variante cuando corresponda.

## Puerta de publicación obligatoria
Un producto solo puede pasar a activo cuando existe:
1. producto real verificable;
2. categoría/subcategoría;
3. presentación exacta;
4. fuente y fecha;
5. referencia/SKU cuando exista;
6. precio fuente o estado de cotización;
7. control de duplicados;
8. imagen verificada cuando sea requerida;
9. costo IMPERIA y cálculo de precio de venta solo cuando el costo esté sustentado.

## Estado actual de referencia
- Auditoría vigente: 476 productos maestros, 0 issues, 0 duplicate IDs y 0 posibles duplicados en el archivo de auditoría vigente.
- Control histórico/técnico aún muestra 488 registros cargados; esa diferencia debe reconciliarse antes de tratar 488 como catálogo activo.
- Validación vigente: 458 candidatos nuevos en revisión y publicación automática desactivada.
- Exa: conectado mediante workflow/API.
- GitHub: conectado con permisos de administración del repositorio.
- Metricool: conectado a Facebook, Instagram y TikTok.
- Apollo: no conectado.
- Copilot Cloud Agent: la cuenta mostrada no tiene acceso/licencia para asignar tareas al agente; no asumir que está trabajando.
- Otras IAs externas: no asumir conexión hasta verla confirmada.

## Criterio de terminación
Una tarea solo cuenta como terminada si existe evidencia: archivo/commit, resultado de validación, fuente verificable o acción confirmada por el conector.