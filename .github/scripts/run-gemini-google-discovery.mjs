import fs from "node:fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("GEMINI_API_KEY not configured; Google Search discovery skipped safely.");
  process.exit(0);
}

const queue = JSON.parse(fs.readFileSync("data/discovery-queue.json", "utf8"));
const batchSize = Number(process.env.IMAGE_DISCOVERY_BATCH || 5);
const selected = (queue.queue || []).filter(x => x.status === "PENDING_DISCOVERY").slice(0, batchSize);
const results = [];
const seen = new Set();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

for (const item of selected) {
  const prompt = [
    "Actúa como investigador de abastecimiento para IMPERIA 360 Colombia.",
    "Usa Google Search para encontrar páginas públicas actuales de fabricantes, importadores, distribuidores o ferreterías que puedan tener el producto o la familia solicitada.",
    "Prioriza páginas de producto, catálogos y tiendas oficiales. No inventes precios, referencias, stock ni URLs.",
    "Devuelve una respuesta breve con las páginas encontradas y, cuando exista, nombre, referencia, presentación y precio publicado.",
    "Consulta:", item.query
  ].join("\n");

  let response;
  for (let attempt = 1; attempt <= 4; attempt++) {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {"Content-Type": "application/json", "x-goog-api-key": apiKey},
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: prompt,
          tools: [{type: "google_search"}],
          generation_config: {thinking_level: "low"}
        })
      }
    );
    if (response.ok) break;
    if (response.status !== 429) break;
    const waitMs = 2500 * attempt;
    console.log(`Gemini rate limit (429) for ${item.sourceId}; retry ${attempt}/4 after ${waitMs}ms`);
    await sleep(waitMs);
  }

  if (!response?.ok) {
    console.log(`Gemini Google Search failed for ${item.sourceId}: ${response?.status || "unknown"}`);
    await sleep(1200);
    continue;
  }

  const data = await response.json();
  const outputs = (data?.steps || []).filter(s => s.type === "model_output").flatMap(s => s.content || []);
  const text = outputs.filter(x => x.type === "text").map(x => x.text || "").join("").trim();
  const chunks = (data?.steps || []).filter(s => s.type === "google_search_result").flatMap(s => s.result || []);

  for (const chunk of chunks) {
    const web = chunk?.web || chunk;
    const url = String(web?.uri || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    results.push({
      engine: "gemini-google-search",
      sourceId: item.sourceId,
      supplierId: item.supplierId,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      query: item.query,
      resultTitle: web.title || "",
      resultUrl: url,
      groundedSummary: text,
      discoveryStatus: "DISCOVERED",
      verified: false,
      publicationReady: false
    });
  }

  await sleep(1500);
}

const output = {
  version: "1.1.0",
  generatedAt: new Date().toISOString(),
  status: "DISCOVERY_ONLY",
  engine: "gemini-3.8-flash-google-search",
  policy: {
    discoveryIsNotVerification: true,
    automaticPublication: false,
    neverInventPrice: true,
    neverInventImage: true,
    rateLimitMitigation: "small_sequential_batch_with_429_backoff"
  },
  queueItemsProcessed: selected.length,
  resultsCount: results.length,
  results
};

fs.writeFileSync("data/gemini-google-discovery.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({queueItemsProcessed: selected.length, resultsCount: results.length}, null, 2));
