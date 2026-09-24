import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const sources = readJson('data/catalog-sources.json').sources || [];
const outPath = 'data/exa-discovery.json';
const apiKey = process.env.EXA_API_KEY || '';
const consultedAt = new Date().toISOString();

const active = sources.filter(s => s.status === 'active' && Array.isArray(s.searchQueries) && s.searchQueries.length);

if (!apiKey) {
  let previous = null;
  try { previous = readJson(outPath); } catch {}
  if (previous && Array.isArray(previous.results) && previous.results.length) {
    previous.lastAttemptAt = consultedAt;
    previous.status = 'STALE_NO_API_KEY';
    fs.writeFileSync(outPath, JSON.stringify(previous, null, 2) + '\n');
    console.log(JSON.stringify({status:'STALE_NO_API_KEY', preservedResults:previous.results.length}, null, 2));
  } else {
    fs.writeFileSync(outPath, JSON.stringify({
      version: '1.0.0',
      consultedAt,
      status: 'SKIPPED_NO_API_KEY',
      results: []
    }, null, 2) + '\n');
    console.log('Exa discovery skipped: EXA_API_KEY is not configured and no previous evidence exists.');
  }
  process.exit(0);
}

async function searchExa(query) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      query,
      type: 'auto',
      numResults: 10,
      contents: {
        highlights: true
      }
    })
  });
  if (!response.ok) {
    throw new Error(`Exa request failed with HTTP ${response.status}`);
  }
  return response.json();
}

const seen = new Set();
const results = [];

for (const source of active) {
  for (const query of source.searchQueries) {
    const data = await searchExa(query);
    for (const item of (data.results || [])) {
      const key = [source.id, item.url, item.title].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        sourceId: source.id,
        supplierId: source.supplierId,
        source: source.name,
        query,
        url: item.url || null,
        title: item.title || null,
        publishedDate: item.publishedDate || null,
        highlights: item.highlights || [],
        consultedAt
      });
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify({
  version: '1.0.0',
  consultedAt,
  status: 'OK',
  sourcesQueried: active.length,
  results
}, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'OK',
  sourcesQueried: active.length,
  results: results.length
}, null, 2));