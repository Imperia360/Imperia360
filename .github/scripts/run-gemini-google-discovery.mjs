import fs from "node:fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("GEMINI_API_KEY not configured; Google Search discovery skipped safely.");
  process.exit(0);
}

const queue = JSON.parse(fs.readFileSync("data/discovery-queue.json", "utf8"));
const selected = (queue.queue || []).filter(x => x.status === "PENDING_DISCOVERY").slice(0, Number(process.env.IMAGE_DISCOVERY_BATCH || 25));
const results = [];
const seen = new Set();

for (const item of selected) {
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
}

const output = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  status: "DISCOVERY_ONLY",
  engine: "gemini-3.8-flash-google-search",
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

fs.writeFileSync("data/gemini-google-discovery.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({queueItemsProcessed: selected.length, resultsCount: results.length}, null, 2));
