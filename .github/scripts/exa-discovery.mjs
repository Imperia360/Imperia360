import fs from 'node:fs';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sources = readJson('data/catalog-sources.json').sources || [];
const outPath = 'data/exa-discovery.json';
const apiKey = process.env.EXA_API_KEY || '';
const consultedAt = new Date().toISOString();
const active = sources.filter(s => s.status === 'active' && Array.isArray(s.searchQueries) && s.searchQueries.length);

let previous = null;
try { previous = readJson(outPath); } catch {}

if (!apiKey) {
  if (previous && Array.isArray(previous.results) && previous.results.length) {
    previous.lastAttemptAt = consultedAt;
    previous.status = 'STALE_NO_API_KEY';
    fs.writeFileSync(outPath, JSON.stringify(previous, null, 2) + '\n');
    console.log(JSON.stringify({status:'STALE_NO_API_KEY', preservedResults:previous.results.length}, null, 2));
  } else {
    fs.writeFileSync(outPath, JSON.stringify({version:'1.0.0',consultedAt,status:'SKIPPED_NO_API_KEY',results:[]}, null, 2) + '\n');
    console.log('Exa discovery skipped: EXA_API_KEY is not configured and no previous evidence exists.');
  }
  process.exit(0);
}

async function searchExa(query) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {'content-type':'application/json','x-api-key':apiKey},
    body: JSON.stringify({query,type:'auto',numResults:10,contents:{highlights:true}})
  });
  if (!response.ok) throw new Error(`Exa request failed with HTTP ${response.status}`);
  return response.json();
}

const seen = new Set();
const results = [];
let successfulQueries = 0;
const errors = [];

for (const source of active) {
  for (const query of source.searchQueries) {
    try {
      const data = await searchExa(query);
      successfulQueries++;
      for (const item of (data.results || [])) {
        if (!item.url) continue;
        const key = [source.id,item.url,item.title].join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          sourceId:source.id,
          supplierId:source.supplierId || null,
          source:source.name,
          query,
          url:item.url,
          title:item.title || null,
          publishedDate:item.publishedDate || null,
          highlights:item.highlights || [],
          consultedAt
        });
      }
    } catch (error) {
      errors.push({sourceId:source.id,query,error:String(error?.message || error)});
      console.error(`Exa query failed for ${source.id}: ${String(error?.message || error)}`);
    }
  }
}

const status = successfulQueries > 0 ? 'OK' : 'FAILED';
const output = {
  version:'1.0.0',
  consultedAt,
  status,
  sourcesQueried:active.length,
  successfulQueries,
  failedQueries:errors.length,
  errors:errors.slice(0,50),
  results:results.length ? results : (previous?.results || [])
};
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({status,sourcesQueried:active.length,successfulQueries,failedQueries:errors.length,results:output.results.length}, null, 2));
if (successfulQueries === 0 && active.length > 0) process.exitCode = 1;
