/*
 * Cargador del catálogo maestro publicado.
 * Une el catálogo estructurado con imágenes de staging únicamente cuando
 * la evidencia de imagen está verificada y marcada como publicable.
 */

export async function loadProducts(source = './data/products.json') {
  const response = await fetch(source + (source.includes('?') ? '&' : '?') + 'v=' + Date.now());

  if (!response.ok) {
    throw new Error(`No fue posible cargar el catálogo: ${response.status}`);
  }

  let products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error('El catálogo debe ser un arreglo de productos.');
  }
  if (products.length === 0) {
    throw new Error('El catálogo maestro está vacío; se detiene la publicación para evitar un catálogo parcial.');
  }

  // Lote de pinturas con referencias y precios públicos verificados.
  // Se mantiene separado del master histórico para permitir auditoría y enriquecimiento de imágenes.
  try {
    const pr = await fetch('./data/paint-catalog-batch-2026-09-29.json?' + Date.now());
    if (pr.ok) {
      const pd = await pr.json();
      const paintProducts = Array.isArray(pd.products) ? pd.products : [];
      const existing = new Set(products.map(p => String(p?.id)));
      for (const pp of paintProducts) {
        if (!existing.has(String(pp.id))) {
          products.push(pp);
          existing.add(String(pp.id));
        }
      }
    }
  } catch {}

  // Proveedor Tornirap: lista de precios recibida en PDF y tratada como fuente confiable del proveedor.
  try {
    const tr = await fetch('./data/tornirap-products.json?' + Date.now());
    if (tr.ok) {
      const td = await tr.json();
      const tornirap = Array.isArray(td.products) ? td.products : [];
      const existing = new Set(products.map(p => String(p?.id)));
      for (const tp of tornirap) {
        if (!existing.has(String(tp.id))) {
          products.push(tp);
          existing.add(String(tp.id));
        }
      }
    }
  } catch {}

  // Lista de precios de referencia entregada por IMPERIA 360.
  // Esta fuente está autorizada para publicación directa con margen; no requiere
  // verificación externa ni auditoría de precio. Los productos nuevos se incorporan
  // al catálogo maestro desde esta fuente.
  try {
    const ir = await fetch('./data/imperia-reference-pricing.json?' + Date.now());
    if (ir.ok) {
      const id = await ir.json();
      const referenceProducts = Array.isArray(id.newProducts) ? id.newProducts : [];
      const existing = new Set(products.map(p => String(p?.id)));
      for (const rp of referenceProducts) {
        if (!existing.has(String(rp.id))) {
          products.push(rp);
          existing.add(String(rp.id));
        }
      }
    }
  } catch {}

  // Proveedor Roxvan: referencias públicas observadas, con precio IMPERIA
  // calculado según las reglas comerciales configuradas.
  try {
    const rr = await fetch('./data/roxvan-products.json?' + Date.now());
    if (rr.ok) {
      const rd = await rr.json();
      const roxvan = Array.isArray(rd.products) ? rd.products : [];
      const existing = new Set(products.map(p => String(p?.id)));
      for (const rp of roxvan) {
        if (!existing.has(String(rp.id))) {
          products.push({
            id: rp.id,
            name: rp.name,
            identification: { sku: rp.sku, manufacturerReference: rp.sku },
            category: { name: rp.category },
            availability: { status: rp.stockStatus },
            supplier: { name: 'Roxvan', source: rp.source, sourceUrl: rp.sourceUrl },
            pricing: {
              currency: 'COP',
              manualSalePrice: rp.retailPrice,
              manualRetailPrice: rp.retailPrice,
              manualContractorPrice: rp.contractorPrice,
              manualWholesalePrice: rp.wholesalePrice,
              manualMarginPct: 35,
              pricingStatus: 'provisional_published',
              costBasis: 'roxvan_public_wholesale_observed',
              calculationBase: rp.observedWholesaleCost,
              source: rp.source,
              sourceUrl: rp.sourceUrl,
              calculationNote: 'Precio IMPERIA calculado sobre precio mayorista público observado; disponibilidad y costos logísticos se verifican al confirmar el pedido.'
            }
          });
          existing.add(String(rp.id));
        }
      }
    }
  } catch {}

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

  // Los precios automáticos provisionales no se publican. Solo se admiten
  // overrides explícitos o precios con estado comercial validado.

  // Imágenes verificadas por familia visual de tornillería. Una misma imagen
  // representa las variantes que solo cambian en medida/presentación.
  let fastenerFamilyRules = [];
  try {
    const familyResponse = await fetch('./data/fastener-family-images.json?' + Date.now());
    if (familyResponse.ok) {
      const familyData = await familyResponse.json();
      fastenerFamilyRules = Array.isArray(familyData.families) ? familyData.families : [];
    }
  } catch {
    fastenerFamilyRules = [];
  }

  let imageRecords = [];
  let blockedImageSources = ['sofalca.com'];
  try {
    const imageResponse = await fetch('./data/product-images.json?' + Date.now(), { cache: 'no-store' });
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageRecords = Array.isArray(imageData.records) ? imageData.records : [];
      if (Array.isArray(imageData.policy?.blockedImageSources)) {
        blockedImageSources = imageData.policy.blockedImageSources;
      }
    } else {
      console.warn('[IMPERIA 360] No se pudo cargar el registro de imágenes:', imageResponse.status);
    }
  } catch (error) {
    console.warn('[IMPERIA 360] Falló la carga del registro de imágenes:', error);
    imageRecords = [];
  }

  const blockedDomains = blockedImageSources
    .map(value => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  function urlHost(value) {
    try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
  }

  function isBlockedEvidence(record) {
    const hostValues = [
      urlHost(record?.imageUrl),
      urlHost(record?.sourcePage),
      String(record?.source || '').toLowerCase()
    ];
    return blockedDomains.some(domain =>
      hostValues.some(host => host === domain || host.endsWith('.' + domain) || host.includes(domain))
    );
  }

  function isSafeEvidence(record) {
    if (!record || record.publishable !== true || record.verificationStatus !== 'verified_source_image') return false;
    if (!/^https:\/\//i.test(String(record.imageUrl || ''))) return false;
    return !isBlockedEvidence(record);
  }

  const verifiedImages = new Map(
    imageRecords.filter(isSafeEvidence).map(record => [String(record.productId), record])
  );

  const approvedPriceStates = new Set([
    'validated', 'verified', 'approved', 'manual_verified', 'supplier_quote_verified'
  ]);
  const internalKeys = new Set([
    'supplier', 'supplierreference', 'suppliername', 'supplierurl',
    'source', 'sourceurl', 'sourcepage', 'sourcepagename',
    'costbasis', 'calculationbase', 'observedwholesalecost',
    'suppliercost', 'suppliercostcop', 'purchasecost', 'wholesalecost',
    'wholesalecostcop', 'calculationnote', 'sourcereferenceprice'
  ]);

  function stripInternal(value) {
    if (Array.isArray(value)) return value.map(stripInternal);
    if (!value || typeof value !== 'object') return value;
    const cleaned = {};
    for (const [key, child] of Object.entries(value)) {
      if (internalKeys.has(key.toLowerCase())) continue;
      cleaned[key] = stripInternal(child);
    }
    return cleaned;
  }

  function safeExistingImage(images) {
    if (!images || images.verificationStatus !== 'verified_source_image') return null;
    const url = String(images.primary || '');
    if (!/^https:\/\//i.test(url)) return null;
    const evidenceLike = { imageUrl: url, sourcePage: images.sourcePage, source: images.source };
    if (isBlockedEvidence(evidenceLike)) return null;
    return { primary: url, alt: String(images.alt || ''), verificationStatus: images.verificationStatus, verifiedAt: images.verifiedAt };
  }

  const result = products.map(product => {
    const publicProduct = stripInternal(product);
    if (publicProduct.identification && typeof publicProduct.identification === 'object') {
      delete publicProduct.identification.supplierReference;
    }

    const evidence = verifiedImages.get(String(product?.id));
    const productName = String(product?.name || '').toLowerCase();
    const familyEvidence = fastenerFamilyRules.find(rule => {
      const include = rule?.match?.include || [];
      const requireAny = rule?.match?.requireAny || [];
      let namePattern = null;
      try { namePattern = rule?.match?.namePattern ? new RegExp(rule.match.namePattern, 'i') : null; } catch {}
      const exclude = rule?.match?.exclude || [];
      const includesMatch = include.every(token => productName.includes(String(token).toLowerCase()));
      const anyMatch = requireAny.length === 0 || requireAny.some(token => productName.includes(String(token).toLowerCase()));
      const patternMatch = !namePattern || namePattern.test(productName);
      const familyShapeMatch = requireAny.length === 0 ? patternMatch : (anyMatch || patternMatch);
      return rule?.publishable === true
        && rule?.verificationStatus === 'verified_source_image'
        && /^https:\/\//i.test(String(rule?.imageUrl || ''))
        && !isBlockedEvidence(rule)
        && includesMatch
        && familyShapeMatch
        && !exclude.some(token => productName.includes(String(token).toLowerCase()));
    });

    const selectedImage = evidence || familyEvidence;
    const existingImage = safeExistingImage(product.images);
    if (selectedImage) {
      publicProduct.images = {
        primary: selectedImage.imageUrl,
        alt: String(product?.name || ''),
        verificationStatus: selectedImage.verificationStatus,
        verifiedAt: selectedImage.verifiedAt,
        ...(evidence ? {} : { imageReuse: 'visual_family_measurement_variant' })
      };
    } else if (existingImage) {
      publicProduct.images = existingImage;
    } else {
      delete publicProduct.images;
    }

    const override = priceOverrides[String(product?.id)];
    const overrideSale = Number(override?.manualSalePrice);
    const originalPricing = product?.pricing && typeof product.pricing === 'object' ? product.pricing : {};
    const originalStatus = String(originalPricing.status || originalPricing.pricingStatus || '').toLowerCase();
    const originalSale = originalStatus === 'validated' && Number(originalPricing.publicPrice) > 0
      ? Number(originalPricing.publicPrice)
      : (approvedPriceStates.has(originalStatus) ? Number(originalPricing.manualSalePrice) : 0);
    const hasManualOverride = Number.isFinite(overrideSale) && overrideSale > 0;
    const hasValidatedPrice = Number.isFinite(originalSale) && originalSale > 0;

    const publicPricing = {
      currency: String(originalPricing.currency || 'COP'),
      status: hasManualOverride ? 'manual' : (hasValidatedPrice ? 'validated' : 'quote_only'),
      pricingStatus: hasManualOverride ? 'manual_verified' : (hasValidatedPrice ? 'validated' : 'quote_only'),
      quoteOnly: !(hasManualOverride || hasValidatedPrice)
    };

    if (hasManualOverride) {
      publicPricing.manualSalePrice = overrideSale;
      for (const field of ['manualRetailPrice', 'manualContractorPrice', 'manualWholesalePrice']) {
        const value = Number(override?.[field]);
        if (Number.isFinite(value) && value > 0) publicPricing[field] = value;
      }
    } else if (hasValidatedPrice) {
      publicPricing.manualSalePrice = originalSale;
      for (const field of ['manualContractorPrice', 'manualWholesalePrice']) {
        const value = Number(originalPricing[field]);
        if (Number.isFinite(value) && value > 0) publicPricing[field] = value;
      }
    }

    publicProduct.pricing = publicPricing;
    return publicProduct;
  });

  const categoryNames = new Set();
  const productCategory = product => {
    const category = product?.category;
    return String(typeof category === 'object' ? category?.name || '' : category || '').trim();
  };
  for (const product of result) {
    const category = productCategory(product);
    if (category) categoryNames.add(category);
  }
  console.info('[IMPERIA 360] Auditoría de carga:', {
    masterProducts: products.length,
    publicProducts: result.length,
    imageEvidenceAccepted: verifiedImages.size,
    categoriesObserved: categoryNames.size,
    productsWithoutVerifiedImage: result.filter(p => !p.images?.primary).length,
    productsQuoteOnly: result.filter(p => p.pricing?.quoteOnly).length
  });

  return result;
}
