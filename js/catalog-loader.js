/*
 * Cargador del catálogo maestro publicado.
 * Une el catálogo estructurado con imágenes de staging únicamente cuando
 * la evidencia de imagen está verificada y marcada como publicable.
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

  let imageRecords = [];
  try {
    const imageResponse = await fetch('../data/product-images.json');
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageRecords = Array.isArray(imageData.records) ? imageData.records : [];
    }
  } catch {
    imageRecords = [];
  }

  const verifiedImages = new Map(
    imageRecords
      .filter(record => record?.publishable === true && record?.verificationStatus === 'verified_source_image' && record?.imageUrl)
      .map(record => [String(record.productId), record])
  );

  return products.map(product => {
    const evidence = verifiedImages.get(String(product?.id));
    if (!evidence) return product;

    return {
      ...product,
      images: {
        ...(product.images || {}),
        primary: evidence.imageUrl,
        source: evidence.source,
        sourcePage: evidence.sourcePage,
        verificationStatus: evidence.verificationStatus,
        verifiedAt: evidence.verifiedAt
      }
    };
  });
}
