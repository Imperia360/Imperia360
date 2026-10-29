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
const products = [...candidates.values()].slice(0, 100);
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
