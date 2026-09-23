/*
 * Punto de entrada para cargar el catálogo estructurado.
 *
 * En esta etapa no se conecta a index.html ni se ejecuta en la web actual.
 * products.json permanece vacío hasta recibir información real del catálogo.
 */

export async function loadProducts(source = '../data/products.json') {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`No fue posible cargar el catálogo: ${response.status}`);
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error('El catálogo debe ser un arreglo de productos.');
  }

  return products;
}
