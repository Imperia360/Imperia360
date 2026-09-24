import { normalizeText } from './market-normalizer.js';

function refs(product = {}) {
  const i = product.identification || {};
  return [i.sku, i.manufacturerReference, i.supplierReference, ...(i.alternativeReferences || [])]
    .filter(Boolean).map(normalizeText);
}

function productText(product = {}) {
  return normalizeText([
    product.name,
    product.brand?.name,
    product.measurements?.originalText,
    product.measurements?.diameter,
    product.measurements?.length,
    product.measurements?.width,
    product.measurements?.thickness
  ].filter(Boolean).join(' '));
}

export function matchOfferToCatalog(offer, products = []) {
  const offerRef = normalizeText(offer.reference || '');
  if (offerRef) {
    const exact = products.find(p => refs(p).includes(offerRef));
    if (exact) return { status: 'MATCH_EXACT', productId: exact.id, reason: 'reference_match' };
  }
  const offerName = normalizeText(offer.normalizedName || offer.originalProductName || '');
  if (!offerName) return { status: 'NEEDS_REVIEW', productId: null, reason: 'missing_name' };

  let best = null;
  for (const p of products) {
    const text = productText(p);
    if (!text) continue;
    const tokens = new Set(offerName.split(' ').filter(t => t.length > 2));
    const matches = [...tokens].filter(t => text.includes(t)).length;
    const score = tokens.size ? matches / tokens.size : 0;
    if (!best || score > best.score) best = { productId: p.id, score };
  }
  if (best?.score >= 0.85) return { status: 'MATCH_EQUIVALENT', productId: best.productId, reason: 'high_text_similarity', score: best.score };
  if (best?.score >= 0.55) return { status: 'POSSIBLE_MATCH', productId: best.productId, reason: 'partial_text_similarity', score: best.score };
  return { status: 'NEEDS_REVIEW', productId: null, reason: 'no_confident_match' };
}
