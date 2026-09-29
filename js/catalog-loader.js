/*
 * Cargador del catálogo maestro publicado.
 * Une el catálogo estructurado con imágenes de staging únicamente cuando
 * la evidencia de imagen está verificada y marcada como publicable.
 */

export async function loadProducts(source = './data/products.json') {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`No fue posible cargar el catálogo: ${response.status}`);
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error('El catálogo debe ser un arreglo de productos.');
  }

  let priceOverrides = {};
  try {
    const priceResponse = await fetch('./data/price-overrides.json');
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      priceOverrides = priceData?.overrides || {};
    }
  } catch {
    priceOverrides = {};
  }

  let autoPricing = {};
  try { const r=await fetch("./data/auto-pricing.json?"+Date.now()); if(r.ok){const d=await r.json(); autoPricing=d?.records||{};} } catch {}

  let imageRecords = [];
  try {
    const imageResponse = await fetch('./data/product-images.json');
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

  // The master catalog is the publication source. Review records are intentionally
  // rendered too: missing images/prices are enriched progressively and must not make
  // an already recovered product disappear from the public catalog.
  return products.map(product => {
    const evidence = verifiedImages.get(String(product?.id));
    const override = priceOverrides[String(product?.id)];
    const provisional = autoPricing[String(product?.id)];
    const withImages = evidence ? {
      ...product,
      images: {
        ...(product.images || {}),
        primary: evidence.imageUrl,
        source: evidence.source,
        sourcePage: evidence.sourcePage,
        verificationStatus: evidence.verificationStatus,
        verifiedAt: evidence.verifiedAt
      }
    } : product;

    if (!override?.manualSalePrice && !provisional?.manualSalePrice) return withImages;

    return {
      ...withImages,
      pricing: {
        ...(withImages.pricing || {}),
        manualSalePrice: Number(override?.manualSalePrice ?? provisional.manualSalePrice),
        manualMarginPct: override?.manualMarginPct ?? provisional?.retailMarginPct ?? null,
        manualWholesalePrice: Number(override?.manualWholesalePrice ?? provisional?.manualWholesalePrice ?? 0),
        manualContractorPrice: Number(override?.manualContractorPrice ?? provisional?.manualContractorPrice ?? 0),
        pricingStatus: override ? "manual" : "provisional_published",
        manualUpdatedAt: override.updatedAt,
        manualUpdatedBy: override.updatedBy
      }
    };

  });
}
