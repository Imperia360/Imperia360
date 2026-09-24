import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const products = readJson('data/products.json');
const offersFile = readJson('data/market-offers.json');
const config = readJson('data/market-validation-config.json');

const offers = Array.isArray(offersFile.offers) ? offersFile.offers : [];
const normalize = (v) => String(v ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();

const refSet = new Map();
for (const p of products) {
  const i = p.identification || {};
  const refs = [i.sku, i.manufacturerReference, i.supplierReference, ...(i.alternativeReferences || [])]
    .filter(Boolean).map(normalize);
  for (const ref of refs) {
    if (ref) refSet.set(ref, p.id);
  }
}

let matched = 0, newCandidates = 0, needsReview = 0, invalid = 0;
const results = [];

for (const offer of offers) {
  const source = offer.source || null;
  const sourceUrl = offer.sourceUrl || null;
  const consultedAt = offer.consultedAt || null;
  const name = offer.originalProductName || offer.name || null;
  const reference = normalize(offer.reference || offer.sku || '');
  const price = offer.price == null ? null : Number(offer.price);
  const issues = [];

  if (!source) issues.push('missing_source');
  if (!sourceUrl) issues.push('missing_source_url');
  if (!consultedAt) issues.push('missing_consulted_at');
  if (!name) issues.push('missing_product_name');
  if (price !== null && !Number.isFinite(price)) issues.push('invalid_price');
  if (price === 0) issues.push('zero_price_requires_review');

  const productId = reference ? refSet.get(reference) : null;
  let status = productId ? 'MATCH_EXACT' : 'NEEDS_REVIEW';

  if (issues.length) {
    status = 'NEEDS_REVIEW';
    invalid += 1;
  } else if (productId) {
    matched += 1;
  } else {
    newCandidates += 1;
    needsReview += 1;
  }

  results.push({
    source,
    sourceUrl,
    consultedAt,
    originalProductName: name,
    reference: reference || null,
    productId,
    status,
    issues
  });
}

const output = {
  version: '1.0.0',
  lastRun: new Date().toISOString(),
  summary: {
    sourcesChecked: new Set(offers.map(o => o.source).filter(Boolean)).size,
    offersRead: offers.length,
    matched,
    newCandidates,
    needsReview,
    invalid,
    masterProducts: products.length,
    automaticPublication: false
  },
  rules: {
    existingMasterProductIsNeverDuplicated: config.publishPolicy.existingMasterProductIsNeverDuplicated,
    inventedPricesAllowed: config.pricePolicy.inventedPricesAllowed
  },
  results
};

fs.writeFileSync('data/validation-results.json', JSON.stringify(output, null, 2) + '\\n');
console.log(JSON.stringify(output.summary, null, 2));
