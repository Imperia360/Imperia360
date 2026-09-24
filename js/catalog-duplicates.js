/* Detección de coincidencias. No elimina, fusiona ni modifica registros. */

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function referenceValues(product = {}) {
  const identification = product.identification ?? {};
  return [identification.sku, identification.manufacturerReference, identification.supplierReference, ...(identification.alternativeReferences ?? [])].map(normalize).filter(Boolean);
}

function signature(product = {}) {
  const measurements = product.measurements ?? {};
  return [product.name, product.brand?.name, product.category?.id, product.subcategory?.id, measurements.originalText, measurements.diameter, measurements.length, measurements.width, measurements.thickness, measurements.gauge, measurements.unit].map(normalize).join('|');
}

export function findDuplicateCandidates(products = []) {
  const referenceMap = new Map();
  const signatureMap = new Map();
  const candidates = [];

  products.forEach((product, index) => {
    referenceValues(product).forEach((reference) => {
      if (referenceMap.has(reference)) candidates.push({ type: 'reference', value: reference, indexes: [referenceMap.get(reference), index], status: 'possible_duplicate' });
      else referenceMap.set(reference, index);
    });
    const key = signature(product);
    if (key !== '||||||||||') {
      if (signatureMap.has(key)) candidates.push({ type: 'technical_signature', value: key, indexes: [signatureMap.get(key), index], status: 'possible_duplicate' });
      else signatureMap.set(key, index);
    }
  });

  return candidates;
}

export { normalize };
