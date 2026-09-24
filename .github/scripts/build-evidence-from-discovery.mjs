import fs from "node:fs";

const discoveryPath = "data/exa-discovery.json";
const apifyPath = "data/apify-results.json";
const offersPath = "data/market-offers.json";

const discovery = JSON.parse(fs.readFileSync(discoveryPath, "utf8"));
const apify = fs.existsSync(apifyPath) ? JSON.parse(fs.readFileSync(apifyPath, "utf8")) : { results: [] };
const existing = JSON.parse(fs.readFileSync(offersPath, "utf8"));

const items = [
  ...(Array.isArray(discovery.results) ? discovery.results : []),
  ...(Array.isArray(apify.results) ? apify.results : [])
];

const key = (x) => [
  x.sourceId || x.source || "",
  x.url || x.sourceUrl || "",
  x.reference || x.sku || "",
  x.productName || x.originalProductName || x.title || x.name || ""
].join("|").toLowerCase().replace(/\\s+/g, " ").trim();

const seen = new Set();
const offers = [];

for (const prior of (existing.offers || [])) {
  const k = key(prior);
  if (!k || seen.has(k)) continue;
  seen.add(k);
  offers.push(prior);
}

for (const item of items) {
  const url = item.url || item.sourceUrl || "";
  const title = item.productName || item.originalProductName || item.title || item.name || "";
  if (!url || !title) continue;

  const row = {
    id: "market_" + Buffer.from(key(item)).toString("base64url").slice(0, 32),
    source: item.sourceId || item.source || "unknown",
    sourceUrl: url,
    consultedAt: item.consultedAt || discovery.consultedAt || new Date().toISOString(),
    originalProductName: title,
    presentation: item.presentation || null,
    sku: item.sku || item.reference || null,
    brand: item.brand || null,
    category: item.category || null,
    price: item.price ?? null,
    currency: item.currency || "COP",
    priceStatus: (item.price != null && Number(item.price) > 0) ? "candidate_verifiable" : "quote_only_or_unknown",
    evidenceType: "discovery",
    publicationReady: false
  };

  const k = key(item);
  if (!seen.has(k)) {
    offers.push(row);
    seen.add(k);
  }
}

const output = {
  ...existing,
  version: "2.0.0",
  lastRun: new Date().toISOString(),
  policy: {
    discoveryIsNotVerification: true,
    publicationRequiresEvidence: true,
    zeroOrMissingPriceMeansUnknown: true
  },
  offers
};

fs.writeFileSync(offersPath, JSON.stringify(output, null, 2) + "\\n");
console.log(JSON.stringify({inputItems: items.length, totalOffers: offers.length}));
