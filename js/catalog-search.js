/*
 * Búsqueda preparada para el catálogo futuro.
 * No se conecta a index.html ni carga productos en esta etapa.
 */

const SEARCH_FIELDS = [
  'name',
  'identification.sku',
  'identification.manufacturerReference',
  'identification.supplierReference',
  'brand.name',
  'category.name',
  'subcategory.name',
  'measurements.originalText',
  'tags',
  'specifications'
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flatten);
  return [value];
}

function getValue(source, path) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

export function searchCatalog(products = [], query = '') {
  const term = normalize(query);

  if (!term) return products;

  return products.filter((product) => SEARCH_FIELDS.some((field) => {
    const values = flatten(getValue(product, field));
    return values.some((value) => normalize(value).includes(term));
  }));
}

export { SEARCH_FIELDS, normalize };
