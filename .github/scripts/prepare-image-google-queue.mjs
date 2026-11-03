import fs from "node:fs";

const ref = JSON.parse(fs.readFileSync("data/imperia-reference-pricing.json", "utf8"));
const imgs = JSON.parse(fs.readFileSync("data/product-images.json", "utf8"));
const catalog = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
const records = imgs.records || [];
const hasVerifiedImage = new Set(records
  .filter(r => r?.publishable === true && r?.verificationStatus === "verified_source_image" &&
    r?.imageUrl && !/sofalca\.com/i.test(String(r.imageUrl)) &&
    !/sofalca\.com/i.test(String(r.sourcePage || "")))
  .map(r => String(r.productId)));
const candidates = new Map();
for (const p of [...(Array.isArray(catalog) ? catalog : []), ...(ref.newProducts || [])]) {
  if (!p?.id || hasVerifiedImage.has(String(p.id))) continue;
  if (!candidates.has(String(p.id))) candidates.set(String(p.id), p);
}
const retries = JSON.parse(fs.readFileSync("data/image-enrichment-retries.json", "utf8"));
const attempts = id => Number(retries.products?.[String(id)]?.attempts || 0);
function priority(p) {
  const n = String(p?.name || "").toLowerCase();
  if (/\b(led|bombillo led|reflector led|panel led|tubo led|luminaria led|lampara led|lámpara led|downlight|plafon led|cinta led|tira led)\b/.test(n)) return 70;
  if (/drywall|tornillo|chazo|anclaje|tarugo|taquete|arandela|perno|varilla roscada/.test(n)) return 50;
  if (/pintura|vinilo|viniltex|sapolin|cuñete|balde/.test(n)) return 40;
  if (/cable|alambre|breaker|interruptor|tomacorriente|sensor|clavija|panel|luminaria/.test(n)) return 30;
  return 10;
}
const products = [...candidates.values()]
  .sort((a,b) => priority(b)-priority(a) || attempts(a.id)-attempts(b.id) || String(a.id).localeCompare(String(b.id)))
  .slice(0, 200);
const queue = products.map((p, i) => ({
  sourceId: "product-image-" + p.id,
  supplierId: p?.source?.supplierId || "catalog",
  sourceName: p?.source?.name || "Catálogo IMPERIA 360",
  sourceUrl: p?.source?.url || null,
  query: [p.name, p?.brand?.name, p?.identification?.manufacturerReference, p?.identification?.sku].filter(Boolean).join(" | "),
  status: "PENDING_DISCOVERY",
  priority: 100 - i
}));
fs.writeFileSync("data/discovery-queue.json", JSON.stringify({
  version: "image-only-1.1.0",
  generatedAt: new Date().toISOString(),
  status: "IMAGE_DISCOVERY_ONLY",
  queue
}, null, 2) + "\n");
console.log(JSON.stringify({
  queued: queue.length,
  catalogCandidates: candidates.size,
  verifiedImagesExcluded: hasVerifiedImage.size,
  blockedOrUnverifiedRecordsRetried: records.filter(r => r?.imageUrl && !hasVerifiedImage.has(String(r.productId))).length
}, null, 2));
