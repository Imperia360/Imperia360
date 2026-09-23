/*
 * Base de búsqueda para el catálogo futuro.
 *
 * No modifica la búsqueda actual porque todavía no está conectado a index.html.
 * Busca únicamente en los campos que existan y no inventa información faltante.
 */

const searchableFields = [
  'name',
  'reference',
  'brand',
  'category',
  'subcategory',
  'measurements'
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function searchProducts(products, query) {
  const term = normalize(query);

  if (!term) {
    return products;
  }

  return products.filter((product) =>
    searchableFields.some((field) => normalize(product[field]).includes(term))
  );
}
