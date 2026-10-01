import fs from "node:fs";
const ref=JSON.parse(fs.readFileSync("data/imperia-reference-pricing.json","utf8"));
const imgs=JSON.parse(fs.readFileSync("data/product-images.json","utf8"));
const existing=new Set((imgs.records||[]).filter(r=>r?.imageUrl).map(r=>String(r.productId)));
const products=(ref.newProducts||[]).filter(p=>p?.id&&!existing.has(String(p.id))).slice(0,100);
const queue=products.map((p,i)=>({sourceId:"reference-image-"+p.id,supplierId:"imperia-reference-list",sourceName:"Lista de precios IMPERIA 360",sourceUrl:null,query:[p.name,p.identification?.sku].filter(Boolean).join(" | "),status:"PENDING_DISCOVERY",priority:100-i}));
fs.writeFileSync("data/discovery-queue.json",JSON.stringify({version:"image-only-1.0.0",generatedAt:new Date().toISOString(),status:"IMAGE_DISCOVERY_ONLY",queue},null,2)+"\n");
console.log(JSON.stringify({queued:queue.length},null,2));
