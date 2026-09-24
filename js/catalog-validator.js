/* Validaciones generales para datos futuros. No carga datos ni se conecta a la interfaz. */

const ALLOWED_RECORD_STATUSES = ['draft', 'review', 'active', 'inactive', 'archived'];
const ALLOWED_DATA_STATUSES = ['pending_verification', 'verified', 'incomplete'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateCatalogRecord(record = {}) {
  const issues = [];
  const missingFields = [];

  if (!isObject(record)) return { valid: false, issues: ['El registro debe ser un objeto.'], missingFields: [] };
  if (record.id == null) missingFields.push('id');
  if (record.name == null) missingFields.push('name');
  if (!isObject(record.identification)) missingFields.push('identification');
  if (!isObject(record.category)) missingFields.push('category');
  if (!Array.isArray(record.presentations)) missingFields.push('presentations');
  if (!isObject(record.images)) missingFields.push('images');
  if (!isObject(record.pricing)) missingFields.push('pricing');
  if (!isObject(record.availability)) missingFields.push('availability');
  if (!isObject(record.dataQuality)) missingFields.push('dataQuality');

  if (record.status != null && !ALLOWED_RECORD_STATUSES.includes(record.status)) issues.push('Estado de producto no permitido.');
  if (record.pricing?.publicPrice === 0 || record.pricing?.wholesalePrice === 0) issues.push('Revisar precios cero: no representan automáticamente un precio desconocido.');
  if (record.dataQuality?.verified === true && record.dataQuality?.duplicateStatus !== 'clear') issues.push('Un registro verificado no puede conservar un duplicado pendiente o confirmado.');

  return { valid: issues.length === 0 && missingFields.length === 0, issues, missingFields };
}

export function validateCatalogRecords(records = []) {
  if (!Array.isArray(records)) return [{ valid: false, issues: ['La carga debe ser un arreglo.'], missingFields: [] }];
  return records.map(validateCatalogRecord);
}

export { ALLOWED_DATA_STATUSES };
