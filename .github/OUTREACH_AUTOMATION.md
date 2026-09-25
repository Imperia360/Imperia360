# IMPERIA 360 — Automatización comercial y prospección B2B

## Objetivo
Construir una base comercial verificable de empresas y negocios potencialmente compradores y convertirla en campañas segmentadas, sin inventar datos ni enviar spam.

## Segmentos
1. Conjuntos residenciales y administraciones: mantenimiento, plomería, eléctrico, pintura, cerrajería, herramientas.
2. Empresas y oficinas: mantenimiento, EPP, eléctricos, ferretería recurrente.
3. Microempresas y contratistas: consumibles, tornillería, herramientas, PVC, pintura.
4. Ferreterías y tornillerías: canal mayorista/B2B y referencias de alta rotación.
5. Constructoras y maestros: materiales, fijaciones, eléctricos, plomería.
6. Proveedores/importadores: negociación de abastecimiento y alianzas.

## Campos mínimos
lead_id, tipo_cliente, empresa, localidad/barrio, ciudad, sitio_web, fuente_url, teléfono_publico, email_publico, whatsapp_publico_si_empresa_lo_publica, responsable_publico_si_aplica, categoría_interés, fuente_fecha, consentimiento_whatsapp, estado, última_interacción, opt_out.

## Reglas
- Solo datos comerciales publicados por la propia organización o directorios públicos permitidos.
- No recolectar números personales para campañas masivas.
- WhatsApp: contactar solo cuando exista consentimiento explícito y conservar evidencia del opt-in.
- Para conversaciones iniciadas por la empresa en WhatsApp Business Platform, usar plantillas aprobadas.
- Respetar inmediatamente bajas, bloqueos y solicitudes de no contacto.
- Email: segmentar, identificar claramente a IMPERIA 360 y ofrecer baja.
- Nunca comprar bases de datos ni usar scraping para evadir controles.
- No enviar automáticamente hasta validar fuente, finalidad y permiso.
- No inventar precios: cada oferta debe usar precios verificados del catálogo o indicar cotización.

## Flujo automático
Investigación -> normalización -> deduplicación -> clasificación -> validación de fuente -> consentimiento -> campaña -> respuesta -> CRM -> seguimiento -> baja.

## IA por frente
EXA: investigación de empresas y fuentes públicas.
APIFY/automatizador autorizado: captura estructurada solo de fuentes permitidas.
COPILOT: ingeniería, validadores, tests y automatización.
CHATGPT/CODEX: orquestación, segmentación, textos y control de evidencia.
AUDITOR: duplicados, datos faltantes, consentimiento y calidad.
TESTER: pruebas de flujo y publicación.
DOCUMENTADOR: trazabilidad y reglas.

## Campañas iniciales
A) Administraciones: kit de mantenimiento y cotización.
B) Contratistas: precios por volumen y disponibilidad bajo pedido.
C) Ferreterías/tornillerías: canal mayorista y referencias de alta rotación.
D) Empresas: reposición recurrente y atención B2B.
E) Reactivación: solo contactos que hayan aceptado comunicaciones.

## Métricas
leads_verificados, leads_con_email, leads_con_whatsapp_publico, opt_in_whatsapp, emails_enviados, respuestas, cotizaciones, ventas, bajas, rebotes, bloqueos/reportes.

## Puerta de seguridad
Ningún proceso debe enviar mensajes a una lista recién recolectada. Primero se crea la base, se valida la fuente y se clasifica el consentimiento; después se habilita la campaña correspondiente.
