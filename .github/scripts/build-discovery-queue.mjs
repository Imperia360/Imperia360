import fs from "node:fs";

const sources = JSON.parse(fs.readFileSync("data/catalog-sources.json", "utf8"));
const active = (sources.sources || []).filter(s => ["active","discovery"].includes(s.status));

const queue = [];
for (const source of active) {
  for (const query of (source.searchQueries || [])) {
    queue.push({
      sourceId: source.id,
      supplierId: source.supplierId || null,
      sourceName: source.name,
      sourceUrl: source.url || null,
      priceAccess: source.priceAccess || "unknown",
      stockAccess: source.stockAccess || "unknown",
      query,
      status: "PENDING_DISCOVERY",
      publicationReady: false
    });
  }
}

const unique = [];
const seen = new Set();
for (const item of queue) {
  const key = [item.sourceId, item.query].join("|").toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(item);
}

const output = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  policy: {
    discoveryIsNotVerification: true,
    neverInventPrices: true,
    neverInventImages: true,
    neverPublishWithoutEvidence: true
  },
  sources: active.length,
  queries: unique.length,
  queue: unique
};

fs.writeFileSync("data/discovery-queue.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({sources: active.length, queries: unique.length}));
