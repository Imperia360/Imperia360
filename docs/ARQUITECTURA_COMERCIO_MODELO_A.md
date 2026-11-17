# IMPERIA 360 — Arquitectura comercial Modelo A

Estado: diseño de implementación; no habilita por sí solo cobros ni pagos reales.
Modelo aprobado: IMPERIA cobra al cliente, liquida al proveedor y conserva el margen.

## 1. Principio financiero
- El cliente paga una sola vez a IMPERIA 360.
- IMPERIA registra el pago y solo después de recibir confirmación verificable del gateway inicia el abastecimiento.
- Cada línea se enruta al proveedor asignado. Un pedido del cliente puede generar varios subpedidos.
- El proveedor recibe su costo acordado y los cargos de despacho aprobados. IMPERIA conserva el margen neto después de gateway, flete asumido, impuestos, devoluciones y otros costos.
- No se promete disponibilidad, fecha ni precio de proveedor sin confirmación reciente.

## 2. Arquitectura objetivo
1. Tienda estática actual (GitHub Pages): catálogo, carrito y captura de datos.
2. API de comercio (Vercel): validación server-side, creación de orden, integración Wompi, webhooks y enrutamiento de abastecimiento.
3. Base de datos transaccional administrada (Postgres/Supabase o Vercel Postgres): órdenes, subórdenes, pagos, eventos, proveedores, inventario/precios observados y libro de liquidaciones. No guardar pedidos en archivos JSON ni en memoria del serverless.
4. Cola durable / patrón outbox: eventos de pago y órdenes a proveedores con reintentos idempotentes.
5. Adaptadores de proveedores: API primero; después portal/checkout asistido, WhatsApp Business o correo. Adaptador manual como último recurso.
6. Panel admin: órdenes, proveedor, costo confirmado, estado de pago, conciliación, despacho, devolución y margen.

## 3. Flujo de compra obligatorio
- Cotizar carrito: servidor vuelve a leer productos y ofertas de proveedor; calcula precio, costos, flete, impuestos, tarifa del gateway y margen neto.
- Validar: cada línea debe tener supplierId, SKU/referencia exacta, costo proveedor confirmado, stock/disponibilidad confirmada, vigencia de la cotización y reglas de despacho.
- Si alguna línea falla, no cobrar automáticamente ese carrito: informar qué línea requiere confirmación y ofrecer retirar/guardar esa línea.
- Crear orden IMP con snapshot inmutable de nombres, SKU, cantidades, precio público, costo, flete, impuestos, tarifa y margen estimado.
- Crear checkout Wompi por el total de IMPERIA.
- Confirmar pago exclusivamente por webhook firmado/verificado y/o consulta server-to-server a Wompi. No confiar en redirect del navegador.
- Tras pago APPROVED, generar subórdenes por proveedor, enviar cada una una sola vez (idempotencia), esperar aceptación y registrar número de orden del proveedor.
- Pagar al proveedor solo contra suborden aceptada y costo final confirmado; usar API de pagos a terceros si IMPERIA está habilitada, o proceso bancario aprobado con doble control. Nunca automatizar pagos usando claves personales o credenciales de clientes.
- Capturar guía, transportadora, entrega y conciliación. Reembolsos/cancelaciones revierten el libro contable y detienen órdenes aún no despachadas.

## 4. Máquina de estados
Orden IMPERIA: DRAFT → QUOTED → AWAITING_PAYMENT → PAID → SUPPLIER_PENDING → PARTIALLY_ACCEPTED / ACCEPTED → PARTIALLY_DISPATCHED / DISPATCHED → DELIVERED → RECONCILED.
Excepciones: QUOTE_EXPIRED, PAYMENT_FAILED, SUPPLIER_REJECTED, OUT_OF_STOCK, REFUND_PENDING, REFUNDED, DISPUTED, MANUAL_REVIEW.

Suborden proveedor: CREATED → SENT → ACKNOWLEDGED → PAYMENT_PENDING → PAID → DISPATCHED → DELIVERED; excepciones REJECTED, CANCELLED, REFUND_REQUIRED.

## 5. Fórmula de margen
Margen neto por línea = precio cobrado sin impuestos trasladables − costo proveedor confirmado − flete asumido por IMPERIA − comisión gateway − costos operativos variables − provisión de devoluciones/garantías.
No fijar el margen como porcentaje ciego. El precio público se calcula desde costo real y margen objetivo aprobado, con redondeo comercial. El costo interno jamás se expone en la ficha pública.

## 6. Datos mínimos
Proveedor: id, razón social/nombre comercial, NIT si aplica, contacto autorizado, canal de pedidos, método de pago, términos, ciudades/cobertura, política de devolución, estado de verificación, credenciales en secretos (nunca en JSON), SLA.
Oferta proveedor: productId, supplierId, SKU proveedor, presentación/unidad, costo, impuestos, stockStatus, fecha/hora de consulta, expiresAt, costo/envío, fuente de evidencia.
Orden: orderId, customerId, total, currency, paymentStatus, paymentReference, paymentEventId, orderState, timestamps.
Línea: productId, SKU, qty, unitSale, supplierId, supplierSKU, confirmedUnitCost, shippingAllocation, tax, gatewayFeeAllocation, netMargin.
Suborden: supplierOrderId, orderId, supplierId, lines, supplierTotal, supplierPaymentStatus, supplierReference, tracking/carrier, event history.
Ledger: entries debit/credit, beneficiary, reference, amount, status, idempotencyKey, createdAt, settledAt.

## 7. Controles de seguridad y operación
- Secretos solo en Vercel Environment Variables; nunca en GitHub, navegador ni JSON público.
- Verificar firma/checksum del webhook según documentación del gateway; deduplicar eventos.
- Idempotencia en creación de pago, suborden y desembolso.
- Cifrar datos personales en reposo y limitar acceso por rol.
- No almacenar números completos de tarjeta ni CVV.
- Registro de auditoría inmutable para cambios de costo, precio, proveedor, pago y reembolso.
- No marcar orden pagada por captura, correo, redirección o mensaje de WhatsApp.
- No realizar desembolso si el proveedor no está verificado, no existe cuenta beneficiaria autorizada o no se ha confirmado el costo.
- Publicar únicamente productos con precio público vigente y ruta de abastecimiento viable.

## 8. Integración de pagos
Wompi checkout/link cobra a IMPERIA como comercio. La confirmación de pago debe venir de webhook y validación server-to-server. La dispersión a proveedores es un flujo separado: evaluar la API de Pagos a Terceros de Wompi y sus requisitos de habilitación; mientras tanto, conciliación y transferencia manual aprobada. No asumir que el checkout del cliente divide automáticamente el dinero.

## 9. Secuencia de implementación
P0 — Cerrar brechas: persistencia Postgres, autenticación admin, webhook verificado, órdenes y libro de movimientos.
P1 — Alta de proveedores: registrar proveedores reales y obtener autorización, términos, canal, beneficiario y catálogo/SKU.
P2 — Ofertas: conectar disponibilidad/precio en tiempo real o cotización con vigencia; importar solo ofertas respaldadas.
P3 — Checkout: recalcular y bloquear carrito si falta proveedor/costo/stock; cobrar con Wompi.
P4 — Fulfillment: crear subórdenes, confirmación de proveedor, pago, guía y notificaciones.
P5 — Conciliación: reportes de ventas, costos, utilidad, comisión, impuestos, reembolsos y saldos por proveedor.
P6 — Lanzamiento gradual: pruebas sandbox; pedidos internos; piloto con 1–3 proveedores verificados; luego ampliar.

## 10. Criterios para declarar ventas activas
- Orden y líneas persisten en base de datos.
- Webhook de pago validado, con prueba de duplicado/reintento.
- Un proveedor real acepta una orden de prueba y confirma costo/stock.
- Pago al proveedor se concilia con referencia y comprobante.
- El margen calculado coincide con extracto y liquidación.
- Cancelación, falta de stock y reembolso probados.
- Facturación electrónica integrada con proveedor tecnológico autorizado cuando aplique.
Hasta cumplirlos, el sitio puede captar solicitudes/cotizaciones, pero no debe afirmar que la compra y el abastecimiento están automatizados de extremo a extremo.
