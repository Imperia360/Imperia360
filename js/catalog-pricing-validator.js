/* Valida y registra metadatos de precios provenientes de fuentes reales. No calcula ni modifica precios. */

const ALLOWED_STATUSES = ['unvalidated', 'validated', 'quote_only', 'not_available'];

export function validatePricing(pricing = {}) {
  const issues = [];
  const requiredSourceFields = ['source', 'sourceUrl', 'consultedAt'];

  if (pricing.status && !ALLOWED_STATUSES.includes(pricing.status)) issues.push('Estado de precio no permitido.');
  if (pricing.publicPrice != null && typeof pricing.publicPrice !== 'number') issues.push('El precio publicado debe ser numérico o null.');
  if (pricing.previousPrice != null && typeof pricing.previousPrice !== 'number') issues.push('El precio anterior debe ser numérico o null.');
  if (pricing.status === 'validated') requiredSourceFields.forEach((field) => { if (!pricing[field]) issues.push(`Falta ${field} para un precio validado.`); });
  if (pricing.publicPrice === 0 || pricing.previousPrice === 0) issues.push('Revisar precio cero; no se interpreta automáticamente como desconocido.');

  return { valid: issues.length === 0, issues };
}

export function recordPricingObservation(input = {}) {
  return {
    publishedPrice: input.publishedPrice ?? null,
    previousPrice: input.previousPrice ?? null,
    currency: input.currency ?? null,
    presentation: input.presentation ?? null,
    source: input.source ?? null,
    sourceUrl: input.sourceUrl ?? null,
    consultedAt: input.consultedAt ?? null,
    validationStatus: input.validationStatus ?? 'unvalidated'
  };
}

export { ALLOWED_STATUSES };
