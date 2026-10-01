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

  let autoPricing = {};
  try { const r=await fetch("./data/auto-pricing.json?"+Date.now()); if(r.ok){const d=await r.json(); autoPricing=d?.records||{};} } catch {}

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
    const productName = String(product?.name || '').toLowerCase();
    const familyEvidence = fastenerFamilyRules.find(rule => {
      const include = rule?.match?.include || [];
      const requireAny = rule?.match?.requireAny || [];
      const namePattern = rule?.match?.namePattern ? new RegExp(rule.match.namePattern, 'i') : null;
      const exclude = rule?.match?.exclude || [];
      const includesMatch = include.every(token => productName.includes(String(token).toLowerCase()));
      const anyMatch = requireAny.length === 0 || requireAny.some(token => productName.includes(String(token).toLowerCase()));
      const patternMatch = !namePattern || namePattern.test(productName);
      const familyShapeMatch = requireAny.length === 0 ? patternMatch : (anyMatch || patternMatch);
      return rule?.publishable === true && rule?.verificationStatus === 'verified_source_image' && rule?.imageUrl
        && includesMatch
        && familyShapeMatch
        && !exclude.some(token => productName.includes(String(token).toLowerCase()));
    });
    const effectiveEvidence = evidence || familyEvidence;
    const rawOverride = priceOverrides[String(product?.id)];
    let provisional = autoPricing[String(product?.id)];
    // Regla IMPERIA para referencias de la lista cuyo producto se expresa por kilo:
    // $15.300 COP/kg, presentación de 20 kg = $306.000 de costo base; se aplican
    // los márgenes IMPERIA y esta regla prevalece sobre precios automáticos anteriores.
    const productTextForKg = String(product?.name || '') + ' ' + String(product?.description || '');
    const isKilogramReference = /\b(?:kilo|kilos|kg|kgs)\b/i.test(productTextForKg);
    const kilogramPricing = isKilogramReference ? {
      manualSalePrice: 470800,
      manualRetailPrice: 470800,
      manualContractorPrice: 408000,
      manualWholesalePrice: 382500,
      manualMarginPct: 35,
      pricingStatus: 'imperia_kilogram_rule',
      costBasis: 'imperia_reference_kilogram_rule',
      calculationBase: 306000,
      manualUpdatedAt: '2026-10-01T00:00:00.000Z',
      manualUpdatedBy: 'IMPERIA 360 kilogram rule: 15300 COP/kg x 20 kg'
    } : null;
    if (kilogramPricing) provisional = kilogramPricing;
    const override = kilogramPricing ? null : rawOverride;

    const withImages = effectiveEvidence ? {
      ...product,
      images: {
        ...(product.images || {}),
        primary: effectiveEvidence.imageUrl,
        source: effectiveEvidence.source,
        sourcePage: effectiveEvidence.sourcePage,
        verificationStatus: effectiveEvidence.verificationStatus,
        verifiedAt: effectiveEvidence.verifiedAt,
        imageReuse: evidence ? undefined : 'visual_family_measurement_variant'
      }
    } : product;

    // If there is no explicit IMPERIA price yet, calculate one from the
    // verified public market-reference range already attached to the product.
    // This prevents "Cotizar" when a usable market benchmark exists.
    let calculated = null;
    if (!override?.manualSalePrice && !provisional?.manualSalePrice) {
      const ref = withImages.pricing?.sourceReferencePrice;
      const benchmark = Math.max(Number(ref?.max || 0), Number(ref?.min || 0));
      if (benchmark > 0) {
        const retailMarginPct = 35;
        const contractorMarginPct = 25;
        const wholesaleMarginPct = 20;
        const price = (cost, margin) => {
        if (!(cost > 0 && margin < 100)) return 0;
        const raw = cost / (1 - margin / 100);
        return raw < 1000 ? Math.ceil(raw) : Math.ceil(raw / 100) * 100;
      };
        calculated = {
          manualSalePrice: price(benchmark, retailMarginPct),
          manualRetailPrice: price(benchmark, retailMarginPct),
          manualContractorPrice: price(benchmark, contractorMarginPct),
          manualWholesalePrice: price(benchmark, wholesaleMarginPct),
          manualMarginPct: retailMarginPct,
          pricingStatus: "calculated_from_market_reference",
          costBasis: "market_reference_benchmark",
          calculationBase: benchmark,
          calculationNote: "Precio IMPERIA calculado sobre la referencia pública máxima disponible; no es costo confirmado de proveedor."
        };
      }
    }

    if (!override?.manualSalePrice && !provisional?.manualSalePrice && !calculated) return withImages;

    const p = provisional || {};
    const v = calculated || {};
    return {
      ...withImages,
      pricing: {
        ...(withImages.pricing || {}),
        manualSalePrice: Number(override?.manualSalePrice ?? p.manualSalePrice ?? v.manualSalePrice),
        manualMarginPct: override?.manualMarginPct ?? p.retailMarginPct ?? v.manualMarginPct ?? null,
        manualWholesalePrice: Number(override?.manualWholesalePrice ?? p.manualWholesalePrice ?? v.manualWholesalePrice ?? 0),
        manualContractorPrice: Number(override?.manualContractorPrice ?? p.manualContractorPrice ?? v.manualContractorPrice ?? 0),
        pricingStatus: override ? "manual" : (p.manualSalePrice ? "provisional_published" : "calculated_from_market_reference"),
        costBasis: override ? "manual" : (p.costBasis ?? v.costBasis),
        calculationBase: p.observedWholesaleCost ?? v.calculationBase ?? null,
        manualUpdatedAt: override?.updatedAt ?? p.updatedAt ?? new Date().toISOString(),
        manualUpdatedBy: override?.updatedBy ?? p.updatedBy ?? "IMPERIA 360 automatic pricing"
      }
    };

  });
}
