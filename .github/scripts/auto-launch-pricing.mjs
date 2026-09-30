#!/usr/bin/env node
import fs from "node:fs";
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const products=[...read("data/products.json"),...(read("data/paint-catalog-batch-2026-09-29.json").products||[])];
const exa=read("data/exa-discovery.json");
const offers=read("data/market-offers.json");
const WM=20, CM=25, RM=35;
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const tokens=s=>new Set(norm(s).split(/\s+/).filter(x=>x.length>2));
const fields=p=>[p.name,p.title,p.sku,p.reference,p.identification?.sku,p.identification?.manufacturerReference,p.brand?.name].filter(Boolean).map(String);
function priceFromCost(c,m){if(!(c>0&&m<100)) return 0; const raw=c/(1-m/100); return raw<1000 ? Math.ceil(raw) : Math.ceil(raw/100)*100}
function parseWholesale(text){
 const s=String(text||"");
 const patterns=[
  /precio por unidad al por mayor[^$]{0,100}\$\s*([\d.]+)/i,
  /\+12[^$]{0,100}\$\s*([\d.]+)/i,
  /DESDE\s*\$\s*([\d.]+)/i
 ];
 for(const re of patterns){const m=s.match(re);if(m){const n=Number(m[1].replace(/\./g,""));if(n>0)return n}}
 return null;
}
function score(p,r){
 const pf=fields(p).map(norm), rf=fields(r).map(norm);
 const refSet=rf.filter(x=>x.length>=3);
 let best=0;
 for(const a of pf)for(const b of refSet){
  if(a&&b&&a===b)best=Math.max(best,1);
  const A=tokens(a),B=tokens(b); if(A.size&&B.size){let hit=0;for(const x of A)if(B.has(x))hit++;best=Math.max(best,hit/Math.max(A.size,B.size));}
 }
 return best;
}
const candidates=[];
for(const r of exa.results||[]){
 const wholesale=parseWholesale((r.highlights||[]).join("\n"));
 if(!wholesale)continue;
 let best=null,bs=0;
 for(const p of products){const s=score(p,{name:r.title,reference:r.title,sku:""});if(s>bs){bs=s;best=p}}
 if(best && bs>=0.55)candidates.push({product:best,observedWholesaleCost:wholesale,source:r.url,sourceName:r.source,matchScore:Number(bs.toFixed(3)),consultedAt:r.consultedAt});
}
for(const o of offers.offers||[]){
 if(!(Number(o.price)>0))continue;
 let best=null,bs=0;
 for(const p of products){const s=score(p,{name:o.originalProductName,reference:o.reference,sku:o.sku});if(s>bs){bs=s;best=p}}
 if(best&&bs>=0.8)candidates.push({product:best,observedWholesaleCost:Number(o.price),source:o.sourceUrl,sourceName:o.source,matchScore:Number(bs.toFixed(3)),consultedAt:o.consultedAt});
}
const chosen=new Map();
for(const x of candidates){const id=String(x.product.id);const old=chosen.get(id);if(!old||x.matchScore>old.matchScore)chosen.set(id,x)}
// Any product with a verified public market reference also receives a calculated
// IMPERIA publication price instead of remaining "Cotizar".
for(const p of products){
 const id=String(p.id);
 if(chosen.has(id)) continue;
 const ref=p?.pricing?.sourceReferencePrice;
 const benchmark=Math.max(Number(ref?.max||0),Number(ref?.min||0));
 if(benchmark>0){
   chosen.set(id,{product:p,observedWholesaleCost:benchmark,source:p?.pricing?.sourceUrl||p?.pricing?.source||"market-reference",sourceName:p?.pricing?.sourceName||"Referencia pública de mercado",matchScore:0,consultedAt:p?.pricing?.consultedAt||new Date().toISOString(),basis:"market_reference"});
 }
}
const records={};
for(const x of chosen.values()){
 const c=x.observedWholesaleCost;
 const basis=x.basis==="market_reference"?"market_reference_benchmark":"observed_wholesale_market_price";
 records[String(x.product.id)]={status:"provisional_published",costBasis:basis,observedWholesaleCost:c,source:x.source,sourceName:x.sourceName,matchScore:x.matchScore,wholesaleMarginPct:WM,contractorMarginPct:CM,retailMarginPct:RM,manualWholesalePrice:priceFromCost(c,WM),manualContractorPrice:priceFromCost(c,CM),manualRetailPrice:priceFromCost(c,RM),manualSalePrice:priceFromCost(c,RM),updatedAt:new Date().toISOString(),updatedBy:"IMPERIA 360 auto-launch pricing"};
}
const out={version:"1.1.0",updatedAt:new Date().toISOString(),policy:"PROVISIONAL: observed wholesale offers are preferred; otherwise the verified public market-reference benchmark is used as the calculation base. These are calculated IMPERIA publication prices, not confirmed supplier costs.",defaults:{wholesaleMarginPct:WM,contractorMarginPct:CM,retailMarginPct:RM},records};
fs.writeFileSync("data/auto-pricing.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({products:products.length,provisionalPriced:Object.keys(records).length,defaults:{WM,CM,RM}},null,2));
