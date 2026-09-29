/*
 * Búsqueda de productos IMPERIA 360.
 * Prioriza el producto/los productos concretos antes de la categoría.
 * No inventa coincidencias: solo devuelve productos con evidencia textual.
 */

const SEARCH_FIELDS = [
  'name',
  'identification.sku',
  'identification.manufacturerReference',
  'identification.supplierReference',
  'brand.name',
  'brand',
  'category.name',
  'category',
  'subcategory.name',
  'subcategory',
  'measurements.originalText',
  'presentation',
  'unitOfSale',
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

function valuesFor(product, field) {
  return flatten(getValue(product, field)).map(normalize).filter(Boolean);
}

function exact(values, term) {
  return values.some(value => value === term);
}

function includes(values, term) {
  return values.some(value => value.includes(term));
}

function scoreProduct(product, query) {
  const term = normalize(query);
  const name = valuesFor(product, 'name');
  const sku = [
    ...valuesFor(product, 'identification.sku'),
    ...valuesFor(product, 'identification.manufacturerReference'),
    ...valuesFor(product, 'identification.supplierReference')
  ];
  const brand = [...valuesFor(product, 'brand.name'), ...valuesFor(product, 'brand')];
  const category = [
    ...valuesFor(product, 'category.name'),
    ...valuesFor(product, 'category'),
    ...valuesFor(product, 'subcategory.name'),
    ...valuesFor(product, 'subcategory')
  ];

  if (exact(sku, term)) return 1000;
  if (exact(name, term)) return 950;

  const tokens = term.split(/\s+/).filter(Boolean);
  const all = SEARCH_FIELDS.flatMap(field => valuesFor(product, field));
  const haystack = all.join(' ');
  const matched = tokens.filter(token => haystack.includes(token));
  if (!matched.length) return 0;

  let score = 500 + (matched.length / tokens.length) * 200;

  if (includes(name, term)) score += 180;
  if (includes(brand, term)) score += 60;
  if (includes(category, term) && matched.length < tokens.length) score -= 80;

  return score;
}

export function searchCatalog(products = [], query = '') {
  const term = normalize(query);
  if (!term) return products;

  return products
    .map(product => ({ product, score: scoreProduct(product, term) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.product);
}

export { SEARCH_FIELDS, normalize, scoreProduct };
