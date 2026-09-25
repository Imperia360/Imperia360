import fs from "node:fs";

const apiKey = process.env.EXA_API_KEY;
if (!apiKey) {
  console.log("EXA_API_KEY not configured; live discovery skipped safely.");
  process.exit(0);
}

const queue = JSON.parse(fs.readFileSync("data/discovery-queue.json", "utf8"));
const selected = queue.queue.filter(x => x.status === "PENDING_DISCOVERY").slice(0, 40);
const results = [];
const seen = new Set();

for (const item of selected) {
  const body = {
    query: item.query,
    type: "auto",
    numResults: 5,
    contents: { highlights: true }
  };

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.log(`EXA request failed for ${item.sourceId}: ${response.status}`);
    continue;
  }

  const data = await response.json();
  for (const hit of data.results ?? []) {
    const url = String(hit.url ?? "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    results.push({
      sourceId: item.sourceId,
      supplierId: item.supplierId,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      query: item.query,
      resultTitle: hit.title ?? "",
      resultUrl: url,
      publishedDate: hit.publishedDate ?? null,
      highlights: hit.highlights ?? [],
      discoveryStatus: "DISCOVERED",
      verified: false,
      publicationReady: false
    });
  }
}

const output = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  status: "DISCOVERY_ONLY",
  policy: {
    discoveryIsNotVerification: true,
    automaticPublication: false,
    neverInventPrice: true,
    neverInventImage: true
  },
  queueItemsProcessed: selected.length,
  resultsCount: results.length,
  results
};

fs.writeFileSync("data/exa-discovery.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({queueItemsProcessed: selected.length, resultsCount: results.length}, null, 2));
