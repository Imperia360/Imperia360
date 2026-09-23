/*
 * Utilidades estructurales para el catálogo futuro.
 * No carga datos, no modifica productos y no se conecta a index.html en esta etapa.
 */

export function groupProductsByCategory(products = []) {
  return products.reduce((groups, product) => {
    const categoryId = product?.category?.id ?? null;
    const key = categoryId || 'uncategorized';

    if (!groups[key]) groups[key] = [];
    groups[key].push(product);
    return groups;
  }, {});
}

export function getCategoryById(categories = [], categoryId = null) {
  return categories.find((category) => category?.id === categoryId) ?? null;
}

export function getSubcategoryById(categories = [], subcategoryId = null) {
  for (const category of categories) {
    const subcategory = (category?.subcategories ?? [])
      .find((item) => item?.id === subcategoryId);

    if (subcategory) return subcategory;
  }

  return null;
}

export function getProductImage(product, imageType = 'primary') {
  if (!product?.images) return null;

  if (imageType === 'gallery') {
    return Array.isArray(product.images.gallery)
      ? product.images.gallery
      : [];
  }

  return product.images.primary ?? null;
}

export function getProductPresentations(product) {
  return Array.isArray(product?.presentations)
    ? product.presentations
    : [];
}

export function getRelatedProductIds(product) {
  return Array.isArray(product?.relatedProductIds)
    ? product.relatedProductIds
    : [];
}

export function isPublishableProduct(product) {
  return product?.status === 'active'
    && product?.dataQuality?.duplicateStatus !== 'duplicate'
    && product?.dataQuality?.duplicateStatus !== 'possible_duplicate';
}
