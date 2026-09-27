import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('data/products.json','utf8'));
let total=p.length, published=0, withCost=0, withVerifiedPrice=0, quoteOnly=0, invalidMargin=0;
for(const x of p){
  if(x?.publicationStatus?.startsWith('active')) published++;
  const pr=x?.pricing||{};
  if(Number.isFinite(pr.costPrice)||Number.isFinite(pr.acquisitionCost)) withCost++;
  if(pr.status==='verified_public_price' && Number.isFinite(pr.publicPrice)) withVerifiedPrice++;
  if(pr.status==='quote_only') quoteOnly++;
  if(pr.margin && !Number.isFinite(pr.acquisitionCost) && !Number.isFinite(pr.costPrice)) invalidMargin++;
}
console.log(JSON.stringify({total,published,withCost,withVerifiedPrice,quoteOnly,invalidMargin},null,2));
if(invalidMargin>0) process.exit(1);
