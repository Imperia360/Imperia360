/* Validación futura de imágenes. No descarga, crea ni agrega imágenes. */

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function hasAllowedExtension(path = '') {
  const value = String(path).toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => value.endsWith(extension));
}

export function validateProductImages(product = {}) {
  const images = product.images ?? {};
  const paths = [images.primary, ...(Array.isArray(images.gallery) ? images.gallery : [])].filter(Boolean);
  const issues = [];

  if (images.primary && !hasAllowedExtension(images.primary)) issues.push('La imagen principal no tiene una extensión permitida.');
  if (paths.some((path) => !hasAllowedExtension(path))) issues.push('Una o más imágenes no tienen una extensión permitida.');
  if (new Set(paths).size !== paths.length) issues.push('Hay rutas de imagen repetidas.');

  return { valid: issues.length === 0, issues, imageCount: paths.length, paths };
}

export { ALLOWED_EXTENSIONS };
