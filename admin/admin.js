const OWNER="Imperia360",REPO="Imperia360",BRANCH="main",OVERRIDE_PATH="data/price-overrides.json";
let token="",products=[],overrides={};

const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
const b64decode=s=>decodeURIComponent(Array.prototype.map.call(atob(s.replace(/\s/g,"")),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join(""));
const b64encode=s=>{const bytes=new TextEncoder().encode(s);let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin)};

async function api(path,options={}){
  const r=await fetch("https://api.github.com"+path,{...options,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2026-03-10",...(options.headers||{})}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.message||("GitHub API "+r.status));
  return data;
}
async function verify(){\n  if(/[^\\x00-\\x7F]/.test(token)) throw new Error("El token contiene caracteres no válidos. Pega directamente el token github_pat_… generado por GitHub.");
  const u=await api("/user");
  await api("/repos/"+OWNER+"/"+REPO);
  return u.login;
}
async function loadCatalog(){
  products=await (await fetch("../data/products.json?admin="+Date.now())).json();
  const file=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH+"?ref="+BRANCH);
  const parsed=JSON.parse(b64decode(file.content));
  overrides=parsed.overrides||{};
  window._overrideSha=file.sha;
}
function refPrice(p){
  const r=p?.pricing?.sourceReferencePrice;
  if(!r?.min)return null;
  return r.min===r.max?r.min:(r.min+r.max)/2;
}
function saleFromMargin(cost,margin){if(!(cost>0)||!(margin>=0&&margin<100))return 0;return Math.ceil(cost/(1-margin/100)/100)*100}
function renderFilters(){
  const cats=[...new Set(products.map(p=>typeof p.category==="string"?p.category:String(p.category??"")).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"es"));
  $("category").innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>'<option>'+escapeHtml(c)+'</option>').join("");
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function render(){
  const q=$("search").value.trim().toLowerCase(),cat=$("category").value;
  const list=products.filter(p=>{
    const hay=[p.name,p.category,p.brand?.name,p.identification?.sku,p.identification?.manufacturerReference].filter(Boolean).join(" ").toLowerCase();
    return (!q||hay.includes(q))&&(!cat||p.category===cat);
  });
  $("count").textContent=list.length+" producto(s)";
  $("products").innerHTML=list.slice(0,300).map(card).join("");
  list.slice(0,300).forEach(p=>bindCard(p));
}
function card(p){
  const id=String(p.id??"");const o=overrides[id]||{};const market=refPrice(p);
  return '<article class="product" id="p-'+escapeHtml(id)+'"><h2>'+escapeHtml(p.name||"Producto sin nombre")+'</h2>'+
    '<div class="meta">ID: '+escapeHtml(id)+'</div><div class="meta">'+escapeHtml(p.brand?.name||"")+" · "+escapeHtml(p.category||"")+'</div>'+
    '<div class="meta">SKU: '+escapeHtml(p.identification?.sku||"—")+' · Ref.: '+escapeHtml(p.identification?.manufacturerReference||"—")+'</div>'+
    '<div class="ref"><strong>Referencia de mercado: '+(market?money(market):"No disponible")+'</strong><span class="market">Referencia pública; no es precio de venta IMPERIA.</span></div>'+
    '<div class="grid2"><div class="field"><label>Costo proveedor (solo cálculo)<input class="cost" type="number" min="0" step="100" value=""></label></div>'+
    '<div class="field"><label>Margen manual (%)<input class="margin" type="number" min="0" max="99.99" step="0.01" value="'+escapeHtml(o.manualMarginPct??"")+'"></label></div></div>'+
    '<div class="field"><label>Precio manual IMPERIA<input class="sale" type="number" min="0" step="100" value="'+escapeHtml(o.manualSalePrice??"")+'"></label></div>'+
    '<div class="calc">Precio calculado: <strong class="calcValue">'+(o.manualSalePrice?money(o.manualSalePrice):"—")+'</strong><div class="warn">El costo ingresado no se guarda.</div></div>'+
    '<div class="actions"><button class="btn save">Guardar precio</button><button class="btn clear">Quitar precio manual</button></div>'+
    '<div class="saved">'+(o.updatedAt?"Última modificación: "+new Date(o.updatedAt).toLocaleString("es-CO"):"Sin precio manual")+'</div></article>';
}
function bindCard(p){
  const el=document.querySelector("#p-"+CSS.escape(String(p.id)));if(!el)return;
  const cost=el.querySelector(".cost"),margin=el.querySelector(".margin"),sale=el.querySelector(".sale"),calc=el.querySelector(".calcValue");
  const recalc=()=>{const v=sale.value?Number(sale.value):saleFromMargin(Number(cost.value),Number(margin.value));calc.textContent=v?money(v):"—";if(!sale.value&&v)sale.value=v};
  cost.addEventListener("input",recalc);margin.addEventListener("input",recalc);
  sale.addEventListener("input",()=>{calc.textContent=sale.value?money(sale.value):"—"});
  el.querySelector(".save").addEventListener("click",()=>saveOverride(p,Number(sale.value),Number(margin.value)));
  el.querySelector(".clear").addEventListener("click",()=>removeOverride(p));
}
async function getOverrideFile(){
  return await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH+"?ref="+BRANCH);
}
async function writeOverrides(next,message){
  const current=await getOverrideFile();
  const payload={version:"1.0.0",updatedAt:new Date().toISOString(),overrides:next};
  const result=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH,{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message,content:b64encode(JSON.stringify(payload,null,2)+"\n"),sha:current.sha,branch:BRANCH})
  });
  window._overrideSha=result.content?.sha||null;overrides=next;render();
  alert("Guardado correctamente. Commit: "+(result.commit?.sha||"creado"));
}
async function saveOverride(p,price,margin){
  if(!(price>0)){alert("Indica un precio manual IMPERIA mayor que cero.");return}
  const id=String(p.id);const next={...overrides,[id]:{manualSalePrice:Math.round(price),manualMarginPct:Number.isFinite(margin)?margin:null,updatedAt:new Date().toISOString(),updatedBy:"Administrador IMPERIA 360"}};
  try{await writeOverrides(next,"admin: actualizar precio IMPERIA para "+(p.name||id))}catch(e){alert("No se pudo guardar: "+e.message)}
}
async function removeOverride(p){
  const id=String(p.id);if(!overrides[id])return;
  if(!confirm("¿Quitar el precio manual de este producto?"))return;
  const next={...overrides};delete next[id];
  try{await writeOverrides(next,"admin: retirar precio manual de "+(p.name||id))}catch(e){alert("No se pudo guardar: "+e.message)}
}
$("loginBtn").onclick=async()=>{
  token=$("token").value.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g,"").trim();if(!token){$("loginStatus").textContent="Ingresa tu token de GitHub.";return}
  $("loginBtn").disabled=true;$("loginStatus").textContent="Verificando acceso…";
  try{const login=await verify();await loadCatalog();renderFilters();$("loginView").hidden=true;$("appView").hidden=false;$("loginStatus").textContent="";console.info("Administrador autenticado:",login)}
  catch(e){token="";$("loginStatus").textContent="Acceso rechazado: "+e.message;$("loginBtn").disabled=false}
};
$("logoutBtn").onclick=()=>{token="";products=[];overrides={};$("appView").hidden=true;$("loginView").hidden=false;$("token").value="";$("loginBtn").disabled=false};
$("search").oninput=render;$("category").onchange=render;
