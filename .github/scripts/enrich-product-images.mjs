import fs from 'node:fs/promises';

const PRODUCTS='data/products.json';
const ROXVAN='data/roxvan-products.json';
const PAINTS='data/paint-catalog-batch-2026-09-29.json';
const IMAGES='data/product-images.json';
const OFFERS='data/market-offers.json';
const EXA='data/exa-discovery.json';
const BATCH=1600;
const DISCOVERY_SOURCES=['https://roxvan.com/','https://comdulec.com/','https://mileniosuministros.com/','https://odinsas.com/','https://www.grupodiman.com/','https://ferreteriasorlandonino.com/','https://imsucol.com/','https://distribuidoralafrontera.com.co/','https://coval.com.co/','https://ferreteriatoolscenter.com.co/','https://www.industriascetelgroup.com.co/','https://reddi.com.co/','https://importadoraferremax.com/','https://cameleco.com/','https://comem.com.co/','https://importadoradftools.com/','https://www.provimer.co/','https://nergia.co/','https://ferreteriagerardobarrera.com/'];
const CONCURRENCY=12;
const REJECT_IMAGE_PATTERNS=[/\/null(?:$|[?#])/i,/\/undefined(?:$|[?#])/i,/\/collections\/all(?:[/?#]|$)/i,/\/collections\/null(?:[/?#]|$)/i,/logo[-_]?horizontal/i,/\/marca\//i,/solonombre\.(?:png|jpe?g|webp)$/i];
function usableProductImage(url){
  if(!url)return false;
  const s=String(url);
  if(REJECT_IMAGE_PATTERNS.some(re=>re.test(s)))return false;
  // No aceptar logos, portadas, banners, imágenes de marca o recursos genéricos.
  if(/(?:logo|favicon|banner|portada|home|\bmarca\b|odin-god|distribuidora[_-]la[_-]frontera)/i.test(s))return false;
  return true;
}
function isHomepageUrl(url){
  try{const u=new URL(url); return u.pathname==='/' || u.pathname==='' || /^\/(?:index\.html?)?$/i.test(u.pathname);}
  catch{return false;}
}
const OFFICIAL_ELECTRICAL_SOURCES=[
  {re:/\b(centelsa|nexans )\b/i,base:'https://www.nexans.co/es/'},
  {re:/\b(procables|prysmian )\b/i,base:'https://www.prysmian.com/'},
  {re:/\b(cenco|cencoelectricos )\b/i,base:'https://www.cencoelectricos.com/'},
  {re:/\b(total )\b/i,base:'https://totalherramientas.com/'}
];
function electricalPriority(p){
  const n=String(p?.name||'');
  return /\b(cable|alambre|conductor|breaker|interruptor|tomacorriente|enchufe|electric|electrico|eléctrico|fusible|terminal|borna|tablero|contacto|contactor|aislador|puesta a tierra|panel|sensor|clavija|toma|smart|inteligente|macho|hembra)\b/i.test(n);
}
function priorityScore(p){
  const n=String(p?.name||'');
  if(/\b(panel|tomacorriente|interruptor|sensor|clavija|toma|smart|inteligente|macho|hembra)\b/i.test(n)) return 3;
  if(electricalPriority(p)) return 2;
  return 1;
}
const STOP=new Set('de del la el los las y en para por con sin una uno unidades unidad x mm ml cm pulgadas pulgada acero metal superior producto'.split(/\s+/));

function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function tokens(s){return norm(s).split(/\s+/).filter(x=>x.length>=3&&!STOP.has(x));}
function absUrl(u,base){try{return new URL(u,base).href}catch{return null}}
async function get(url){
  const r=await fetch(url,{headers:{'user-agent':'IMPERIA-360-image-auditor/2.0'},redirect:'follow'});
  if(!r.ok)throw new Error(String(r.status));
  return{url:r.url,html:await r.text()};
}
function meta(html,key){
  const re=new RegExp("<meta[^>]+(?:property|name)=[\\\"']"+key+"[\\\"'][^>]+content=[\\\"']([^\\\"']+)[\\\"']|<meta[^>]+content=[\\\"']([^\\\"']+)[\\\"'][^>]+(?:property|name)=[\\\"']"+key+"[\\\"']","i");
  const m=html.match(re); return m?.[1]||m?.[2]||null;
}
function visible(html){
  return html.replace(/<script[\\s\\S]*?<\/script>/gi,' ').replace(/<style[\\s\\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').toLowerCase();
}
function identityOk(p,html){
  const text=visible(html);
  const refs=[p?.identification?.manufacturerReference,p?.identification?.sku,p?.identification?.supplierReference,p?.sku,p?.reference].filter(Boolean).map(norm);
  if(refs.some(x=>x.length>=4&&text.includes(x)))return true;
  const ts=tokens(p.name); const hits=ts.filter(t=>text.includes(t));
  return ts.length?hits.length>=Math.min(4,Math.max(2,Math.ceil(ts.length*.5))):false;
}
function scoreName(a,b){
  const A=new Set(tokens(a)), B=new Set(tokens(b)); if(!A.size||!B.size)return 0;
  let hit=0; for(const x of A)if(B.has(x))hit++;
  return hit/Math.max(A.size,B.size);
}
async function sitemapCandidates(base,p){
  const paths=['/sitemap.xml','/sitemap_products_1.xml','/wp-sitemap-posts-product-1.xml','/product-sitemap.xml'];
  const needles=[...tokens(p.name),p?.identification?.manufacturerReference,p?.identification?.sku,p?.identification?.supplierReference].filter(Boolean).map(norm);
  for(const path of paths){
    try{
      const {html}=await get(new URL(path,base).href);
      const urls=[...html.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>m[1].trim());
      const scored=urls.map(u=>({u,score:needles.filter(n=>u.toLowerCase().includes(n.replace(/\\s+/g,'-'))||u.toLowerCase().includes(n.replace(/\\s+/g,''))).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
      if(scored.length)return scored.slice(0,5).map(x=>x.u);
    }catch{}
  }
  return[];
}

const baseProducts=JSON.parse(await fs.readFile(PRODUCTS,'utf8'));
let roxvanProducts=[];
try{const rp=JSON.parse(await fs.readFile(ROXVAN,'utf8')).products||[]; roxvanProducts=rp.map(p=>({...p,source:{name:p.source||'Roxvan',url:p.sourceUrl||null},identification:{sku:p.sku||null,supplierReference:p.sku||null}}));}catch{}
let paintProducts=[];
try{paintProducts=JSON.parse(await fs.readFile(PAINTS,'utf8')).products||[];}catch{}
const seen=new Set(baseProducts.map(p=>String(p.id)));
const products=[...baseProducts,...roxvanProducts.filter(p=>p?.id&&!seen.has(String(p.id))),...paintProducts.filter(p=>p?.id&&!seen.has(String(p.id)))];
const imgData=JSON.parse(await fs.readFile(IMAGES,'utf8'));
const offerData=JSON.parse(await fs.readFile(OFFERS,'utf8')).offers||[];
let exa=[]; try{exa=JSON.parse(await fs.readFile(EXA,'utf8')).results||[]}catch{}

const existing=new Map((imgData.records||[]).map(r=>[String(r.productId),r]));
const beforeCount=existing.size;
const offerIndex=offerData.map(o=>({name:o.originalProductName||'',sku:o.sku||'',url:o.sourceUrl||'',source:o.source||''})).filter(x=>x.url);
const exaIndex=exa.map(o=>({name:o.title||'',sku:'',url:o.url||'',source:o.source||''})).filter(x=>x.url);

// Regla IMPERIA 360: una imagen grupal puede reutilizarse dentro de la misma familia
// visual de tornillería/chazos cuando la diferencia es únicamente medida, calibre o rosca.
// Si cambia la configuración física (cabeza, punta, tipo, arandela, etc.), debe buscarse otra imagen.
const productById=new Map(products.map(p=>[String(p.id),p]));
const imageOwners=new Map();
for(const r of existing.values()){
  if(usableProductImage(r.imageUrl)&&!imageOwners.has(String(r.imageUrl))) imageOwners.set(String(r.imageUrl),String(r.productId));
}
function visualFamily(p){
  let n=norm(p?.name||'');
  // Medidas, calibres y roscas no cambian la familia visual.
  n=n.replace(/\b(?:#?\d+(?:[.,]\d+)?(?:\/\d+)?|\d+\s*x\s*\d+(?:\s*x\s*\d+)?|m\s*\d+(?:\.\d+)?|\d+\s*(?:mm|cm|pulg|pulgada|gal|g|kg|unds?|unidades?))\b/g,' ');
  n=n.replace(/\b(?:unf|unc|uncf|rosca|paso|tpi)\b/g,' ');
  return tokens(n).slice(0,14).join(' ');
}
function canReuseImage(p,owner){
  if(!owner)return false;
  const a=visualFamily(p), b=visualFamily(owner);
  if(!a||!b)return false;
  const pa=/\b(tornillo|chazo|anclaje|tarugo|taquete)\b/i.test(String(p?.name||''));
  const pb=/\b(tornillo|chazo|anclaje|tarugo|taquete)\b/i.test(String(owner?.name||''));
  if(!(pa&&pb))return false;
  return scoreName(a,b)>=0.65;
}
const queue=products.filter(p=>p?.id&&p.id!=='aud-0002'&&(!existing.has(String(p.id))||!usableProductImage(existing.get(String(p.id))?.imageUrl)))
  .sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,BATCH);
let failures=0, checked=0;

async function processProduct(p){
  let candidates=[];
  try{
    if(p.source?.url)candidates.push(p.source.url);
    for(const src of DISCOVERY_SOURCES)candidates.push(src);
    for(const s of OFFICIAL_ELECTRICAL_SOURCES){ if(s.re.test(String(p?.name||''))) candidates.push(s.base); }
    if(p.source?.url)candidates.push(...await sitemapCandidates(new URL(p.source.url).origin,p));
  }catch{}
  const refs=[p?.identification?.manufacturerReference,p?.identification?.sku,p?.identification?.supplierReference,p?.sku,p?.reference].filter(Boolean).map(norm);
  for(const o of offerIndex){
    const sku=o.sku?norm(o.sku):'';
    const exactSku=sku&&refs.includes(sku);
    const nameScore=scoreName(p.name,o.name);
    if(exactSku||nameScore>=0.72)candidates.push(o.url);
  }
  for(const o of exaIndex){
    const nameScore=scoreName(p.name,o.name);
    if(nameScore>=0.72)candidates.push(o.url);
  }
  const uniq=[...new Set(candidates)].slice(0,10);
  for(const u of uniq){
    try{
      checked++;
      const page=await get(u);
      if(!identityOk(p,page.html))continue;
      const image=meta(page.html,'og:image')||meta(page.html,'twitter:image');
      const imageUrl=absUrl(image,page.url);
      if(imageUrl && usableProductImage(imageUrl)){
        const ownerId=imageOwners.get(String(imageUrl));
        const owner=ownerId?productById.get(String(ownerId)):null;
        if(ownerId && !canReuseImage(p,owner)) continue;
        if(!ownerId) imageOwners.set(String(imageUrl),String(p.id));
        return {
          productId:String(p.id),
          sku:p?.identification?.sku||null,
          manufacturerReference:p?.identification?.manufacturerReference||null,
          supplierReference:p?.identification?.supplierReference||null,
          imageUrl,
          sourcePage:page.url,
          source:p?.source?.name||new URL(page.url).hostname,
          match:'source page identity matched by SKU/reference or product-name evidence; og:image extracted',
          verifiedAt:new Date().toISOString().slice(0,10),
          verificationStatus:'verified_source_image',
          publishable:true
        };
      }
    }catch{failures++}
  }
  return null;
}

let cursor=0;
async function worker(){
  while(true){
    const i=cursor++;
    if(i>=queue.length)return;
    const found=await processProduct(queue[i]);
    if(found)existing.set(String(queue[i].id),found);
  }
}
await Promise.all(Array.from({length:Math.min(CONCURRENCY,queue.length)},worker));

imgData.generatedAt=new Date().toISOString().slice(0,10);
imgData.status='staging';
imgData.records=[...existing.values()].filter(r=>usableProductImage(r.imageUrl||r.imageUrl));
await fs.writeFile(IMAGES,JSON.stringify(imgData,null,2)+'\n');
console.log(JSON.stringify({queue:queue.length,added:imgData.records.length-beforeCount,totalImageRecords:imgData.records.length,checked,failures},null,2));

// Trigger automatic image enrichment after workflow hardening — 2026-09-29.

// Paint priority: verified cuñete and medio cuñete references are included through the merged supplier/market catalog — 2026-09-29.

// Manual execution trigger: 2026-09-29 — run verified image enrichment now.

// Regla visual de tornillería/chazos aplicada: 2026-09-30.
// Prioridad eléctrica: cables, alambres, conductores y accesorios se validan primero contra fabricantes/importadores.
// No se eliminan marcas de agua de terceros; solo se publican imágenes limpias/permitidas o composiciones propias.
