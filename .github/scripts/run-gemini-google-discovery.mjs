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
let rateLimited = false;

for (const item of selected) {
  if (rateLimited) break;

  const prompt = [
    "Actúa como investigador de abastecimiento para IMPERIA 360 Colombia.",
    "Usa Google Search para encontrar páginas públicas actuales de fabricantes, importadores, distribuidores o ferreterías que puedan tener el producto o la familia solicitada.",
    "Prioriza páginas de producto, catálogos y tiendas oficiales. No inventes precios, referencias, stock ni URLs.",
    "Devuelve una respuesta breve con las páginas encontradas y, cuando exista, nombre, referencia, presentación y precio publicado.",
    "Consulta:", item.query
  ].join("\n");

  const response = await fetch(
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

  if (response.status === 429) {
    console.log("Gemini Google Search returned 429; stopping Gemini for this run so direct supplier discovery can continue.");
    rateLimited = true;
    break;
  }

  if (!response.ok) {
    console.log(`Gemini Google Search failed for ${item.sourceId}: ${response.status}`);
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
  version: "1.2.0",
  generatedAt: new Date().toISOString(),
  status: "DISCOVERY_ONLY",
  engine: "gemini-3.8-flash-google-search",
  policy: {
    discoveryIsNotVerification: true,
    automaticPublication: false,
    neverInventPrice: true,
    neverInventImage: true,
    rateLimitMitigation: "abort_gemini_on_429_then_continue_direct_supplier_discovery"
  },
  queueItemsProcessed: selected.length,
  resultsCount: results.length,
  rateLimited,
  results
};

fs.writeFileSync("data/gemini-google-discovery.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({queueItemsProcessed: selected.length, resultsCount: results.length, rateLimited}, null, 2));
