# Plan de lanzamiento comercial IMPERIA 360

Estado: plan operativo para el Modelo A. No activa cobros reales por sí solo.

## Estado de partida verificado
El control del catálogo consultado el 17-11-2026 reporta 1.526 productos, 1.526 en quote_only y cero precios validados. Las imágenes son un control independiente: no prueban precio, stock ni capacidad de despacho. El registro data/suppliers.json contiene fuentes comerciales potenciales, no integraciones ni proveedores de fulfillment verificados.

## Carril A — Captación inmediata sin riesgo de cobro
- Mostrar información de producto comprobable.
- Para productos sin oferta verificada, usar “Solicitar disponibilidad y precio”.
- Crear solicitud de cotización y responder por WhatsApp/email.
- No cobrar hasta validar costo, stock, flete, impuestos y proveedor.

## Carril B — Venta automática piloto
- Seleccionar 10–20 productos con proveedor real asignado.
- Confirmar costo, stock, flete, impuestos, devolución, cobertura y plazo.
- Configurar precio IMPERIA y margen neto mínimo aprobado.
- Ejecutar sandbox de pagos y webhook; realizar una compra interna controlada.
- Habilitar checkout solo para productos y destinos aprobados.
- Revisar aceptación, tiempos y margen real cada día.

## Carril C — Escalamiento
- Ampliar a 50, 100 y más productos por lotes.
- La métrica de escalamiento es oferta verificable y despacho exitoso, no cantidad de imágenes.
- Automatizar conciliación, reintentos, alertas y SLA.

## Dependencias obligatorias
- Backend Vercel con base de datos transaccional persistente (Postgres/Supabase o equivalente).
- Wompi comercio activo, llaves sandbox/producción, webhook HTTPS y verificación server-to-server.
- Confirmar con Wompi la habilitación de Pagos a Terceros, sus requisitos, límites y beneficiarios. La API de pagos a terceros es un flujo distinto al cobro del cliente; no implica que el dinero del checkout se divida automáticamente.
- Proveedores: identidad, aceptación comercial, canal autorizado, catálogo/SKU, cobertura, términos, beneficiario y orden de prueba.
- Datos tributarios y proveedor tecnológico de facturación electrónica cuando aplique.

## Indicadores
Productos vendibles (precio vigente + proveedor activo + disponibilidad/lead time confirmados); conversión; pagos aprobados; aceptación de proveedor; tiempo pago→aceptación y aceptación→despacho; margen neto; cancelaciones, devoluciones y reclamos; saldos pendientes por proveedor.

## Regla de salida
No declarar tienda lista para ventas automatizadas hasta pasar los criterios de aceptación en docs/ARQUITECTURA_COMERCIO_MODELO_A.md.
