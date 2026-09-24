import fs from "node:fs";

const PRODUCTS = "data/products.json";
const DISCOVERY = "data/exa-discovery.json";
const OUTPUT = "data/product-matches.json";
const REVIEW = "data/reconciliation-review.json";

const normalize = (value = "") => value
  .toString()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const tokens = (value) => new Set(normalize(value).split(/\s+/).filter(Boolean));

const jaccard = (a, b) => {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let intersection = 0;
  for (const t of A) if (B.has(t)) intersection++;
  return intersection / (A.size + B.size - intersection);
};

const readJson = (path, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
};

const rawProducts = readJson(PRODUCTS, []);
const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.products || rawProducts?.items || []);
const discovery = readJson(DISCOVERY, { results: [] });
const results = Array.isArray(discovery) ? discovery : discovery.results || [];

const refs = (p) => [
  p?.sku,
  p?.identification?.sku,
  p?.identification?.manufacturerReference,
  p?.identification?.supplierReference,
  ...(p?.identification?.alternativeReferences || [])
].filter(Boolean).map(normalize);

const master = products.map((p, index) => ({
  product: p,
  index,
  name: normalize(p?.name || p?.nombre || p?.title),
  refs: refs(p),
  brand: normalize(p?.brand || p?.marca)
}));

const matches = [];
const review = [];

for (const item of results) {
  const sourceUrl = item.url || item.sourceUrl || "";
  const sourceId = item.sourceId || "exa";
  const candidateName = item.productName || item.originalProductName || item.title || item.name || "";
  const rawCandidateRef = item.reference || item.sku || "";\n  const candidateRef = normalize(rawCandidateRef === "-" || rawCandidateRef === "—" ? "" : rawCandidateRef);
  const candidateBrand = normalize(item.brand || "");
  let best = null;

  for (const m of master) {
    let score = jaccard(candidateName, m.name);
    const referenceHit = candidateRef && m.refs.includes(candidateRef);
    const brandHit = candidateBrand && candidateBrand === m.brand;

    if (referenceHit) score += 0.70;
    if (brandHit) score += 0.10;
    if (score > (best?.score ?? -1)) best = { ...m, score, referenceHit, brandHit };
  }

  let status = "NEEDS_REVIEW";
  if (best?.referenceHit) status = "MATCH_EXACT";
  else if (best && best.score >= 0.92 && (!candidateBrand || !best.brand || candidateBrand === best.brand)) status = "MATCH_EQUIVALENT";
  else if (best && best.score >= 0.72) status = "POSSIBLE_MATCH";

  const evidence = {
    source: sourceId,
    sourceUrl,
    consultedAt: item.consultedAt || discovery.consultedAt || null,
    originalProductName: candidateName,
    presentation: item.presentation || null,
    price: item.price ?? null,
    priceStatus: item.priceStatus || (item.price != null && Number(item.price) > 0 ? "verifiable_candidate" : "quote_only_or_unknown")
  };

  const row = {
    candidate: {
      name: candidateName,
      reference: item.reference || item.sku || null,
      brand: item.brand || null,
      category: item.category || null
    },
    evidence,
    match: best ? {
      productIndex: best.index,
      productId: best.product?.id || null,
      productName: best.product?.name || best.product?.nombre || null,
      score: Number(best.score.toFixed(4))
    } : null,
    status,
    autoPublish: status === "MATCH_EXACT" || status === "MATCH_EQUIVALENT"
  };

  matches.push(row);
  if (!row.autoPublish) review.push(row);
}

const payload = {
  version: "2.0.0",
  generatedAt: new Date().toISOString(),
  masterProducts: products.length,
  discoveriesReviewed: results.length,
  rules: {
    exact: "referencia/SKU coincidente con evidencia",
    equivalent: "alta similitud semántica con marca compatible y sin contradicción de referencia",
    possible: "similitud parcial; requiere revisión",
    needsReview: "sin evidencia suficiente o campos ambiguos",
    differentProduct: "debe asignarse manualmente cuando se confirme que no corresponde",
    neverInvent: true,
    neverWriteMasterAutomatically: true
  },
  matches
};

fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n");
fs.writeFileSync(REVIEW, JSON.stringify({
  version: "1.0.0",
  generatedAt: payload.generatedAt,
  count: review.length,
  items: review
}, null, 2) + "\n");

console.log(JSON.stringify({ discoveriesReviewed: results.length, matches: matches.length, review: review.length }));
