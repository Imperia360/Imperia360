import fs from 'node:fs';

const token = process.env.APIFY_API_TOKEN || '';
const actorId = process.env.APIFY_ACTOR_ID || '';
const inputFile = 'data/exa-discovery.json';
const outputFile = 'data/apify-results.json';

if (!token || !actorId) {
  fs.writeFileSync(outputFile, JSON.stringify({
    version: '1.0.0',
    status: 'SKIPPED_NO_CREDENTIALS',
    results: []
  }, null, 2) + '\n');
  console.log('Apify collector skipped: credentials are not configured.');
  process.exit(0);
}

const discovery = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const urls = (discovery.results || []).map(r => r.url).filter(Boolean);

const response = await fetch(
  `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}&waitForFinish=120`,
  {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ startUrls: urls.map(url => ({url})) })
  }
);

if (!response.ok) {
  throw new Error(`Apify HTTP ${response.status}`);
}

const run = await response.json();
fs.writeFileSync(outputFile, JSON.stringify({
  version: '1.0.0',
  status: 'OK',
  run: run.data || run,
  inputUrls: urls
}, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'OK',
  inputUrls: urls.length
}, null, 2));