const OWNER="Imperia360",REPO="Imperia360",BRANCH="main",OVERRIDE_PATH="data/price-overrides.json";
let token="",products=[],overrides={},costs={},page=1,pageSize=100,dirty={};
const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const cat=v=>typeof v==="string"?v:(v&&typeof v==="object"?String(v.name??v.label??v.title??v.value??""):String(v??""));
const idOf=p=>String(p.id??"");
const refPrice=p=>{const r=p?.pricing?.sourceReferencePrice;if(!r?.min)return null;return r.min===r.max?r.min:(Number(r.min)+Number(r.max))/2};
const priceFromCost=(cost,margin)=>cost>0&&margin>=0&&margin<100?Math.ceil(cost/(1-margin/100)/100)*100:0;
async function api(path,options={}){
 const r=await fetch("https://api.github.com"+path,{...options,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28",...(options.headers||{})}});
 const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.message||("GitHub API "+r.status)); return d;
}
async function verify(){if(/[^\x00-\x7F]/.test(token))throw new Error("El token contiene caracteres no válidos.");const repo=await api("/repos/"+OWNER+"/"+REPO);return repo.owner?.login||OWNER}
async function load(){
 const r=await fetch("https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/data/products.json?"+Date.now(),{cache:"no-store"});
 products=await r.json();if(!Array.isArray(products))throw new Error("El catálogo no es un arreglo.");
 const file=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH+"?ref="+BRANCH);
 const parsed=JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(file.content.replace(/\s/g,"")),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join("")));
 overrides=parsed.overrides||{};window._sha=file.sha;
 costs=JSON.parse(localStorage.getItem("imperia_admin_costs")||"{}");
 $("summary").textContent=products.length.toLocaleString("es-CO")+" productos cargados · "+Object.keys(overrides).length+" con precios IMPERIA guardados.";
}
function filtered(){
 const q=$("search").value.trim().toLowerCase(), c=$("category").value;
 return products.filter(p=>{const hay=[p.name,cat(p.category),p.brand?.name,p.identification?.sku,p.identification?.manufacturerReference].filter(Boolean).join(" ").toLowerCase();return(!q||hay.includes(q))&&(!c||cat(p.category)===c)});
}
function renderCats(){const a=[...new Set(products.map(p=>cat(p.category)).filter(Boolean))].sort((x,y)=>x.localeCompare(y,"es"));$("category").innerHTML='<option value="">Todas las categorías</option>'+a.map(x=>'<option>'+esc(x)+'</option>').join("")}
function row(p){
 const id=idOf(p),o={...(overrides[id]||{}),...(dirty[id]||{})}, cost=costs[id]||"", m=o.manualWholesalePrice||priceFromCost(Number(cost),Number(o.wholesaleMarginPct??$("whMargin").value)), c=o.manualContractorPrice||priceFromCost(Number(cost),Number(o.contractorMarginPct??$("contractMargin").value)), r=o.manualRetailPrice||o.manualSalePrice||priceFromCost(Number(cost),Number(o.retailMarginPct??$("retailMargin").value));
 return '<tr data-id="'+esc(id)+'"><td><input class="pick" type="checkbox"></td><td><strong>'+esc(p.name||"Sin nombre")+'</strong><br><small>'+esc(cat(p.category))+'</small></td><td>'+esc(p.identification?.sku||"—")+'<br>'+esc(p.identification?.manufacturerReference||"—")+'</td><td>'+esc(refPrice(p)?money(refPrice(p)):"No disponible")+'</td><td><input class="cost" type="number" min="0" step="100" value="'+esc(cost)+'"></td><td><input class="wh" type="number" min="0" step="100" value="'+esc(m||"")+'"></td><td><input class="co" type="number" min="0" step="100" value="'+esc(c||"")+'"></td><td><input class="re" type="number" min="0" step="100" value="'+esc(r||"")+'"></td><td><small>'+esc(o.wholesaleMarginPct??"")+" / "+esc(o.contractorMarginPct??"")+" / "+esc(o.retailMarginPct??"")+'%</small></td></tr>';
}
function render(){
 const list=filtered(),pages=Math.max(1,Math.ceil(list.length/pageSize));page=Math.min(page,pages);const slice=list.slice((page-1)*pageSize,page*pageSize);
 $("count").textContent=list.length.toLocaleString("es-CO")+" producto(s)";$("rows").innerHTML=slice.map(row).join("");$("pageInfo").textContent="Página "+page+" de "+pages;$("prev").disabled=page<=1;$("next").disabled=page>=pages;
 document.querySelectorAll("#rows tr").forEach(tr=>{const id=tr.dataset.id;tr.querySelector(".cost").oninput=e=>{costs[id]=Number(e.target.value)||0;localStorage.setItem("imperia_admin_costs",JSON.stringify(costs));dirty[id]={...(dirty[id]||{}),cost:costs[id]}};["wh","co","re"].forEach(k=>tr.querySelector("."+k).oninput=e=>{dirty[id]={...(dirty[id]||{}),[k]:Number(e.target.value)||0}});});
}
function scopeProducts(){const list=filtered();const s=$("applyScope").value;if(s==="filtered")return list;if(s==="selected")return [...document.querySelectorAll(".pick:checked")].map(x=>products.find(p=>idOf(p)===x.closest("tr").dataset.id)).filter(Boolean);return products}
function applyMargins(){
 const wm=Number($("whMargin").value),cm=Number($("contractMargin").value),rm=Number($("retailMargin").value);
 if([wm,cm,rm].some(x=>!(x>=0&&x<100))){alert("Los márgenes deben estar entre 0 y 99,99%.");return}
 for(const p of scopeProducts()){const id=idOf(p),cost=Number(costs[id]||0);dirty[id]={...(dirty[id]||{}),wholesaleMarginPct:wm,contractorMarginPct:cm,retailMarginPct:rm,manualWholesalePrice:priceFromCost(cost,wm),manualContractorPrice:priceFromCost(cost,cm),manualRetailPrice:priceFromCost(cost,rm),manualSalePrice:priceFromCost(cost,rm)}}
 render();alert("Márgenes aplicados. Los productos sin costo quedan sin precio calculado; no se inventan costos.");
}
function processQuote(){
 const wm=Number($("whMargin").value),cm=Number($("contractMargin").value),rm=Number($("retailMargin").value),lines=$("quoteInput").value.trim().split(/\r?\n/).filter(Boolean);let ok=0,miss=0;
 for(const line of lines){if(/^\s*(id|sku|referencia)/i.test(line))continue;const a=line.split(/[,;\t]/).map(x=>x.trim().replace(/^"|"$/g,""));const cost=Number(String(a[a.length-1]).replace(/\./g,"").replace(",", "."));if(!(cost>0)){miss++;continue}const key=a.slice(0,-1).join(" ").toLowerCase();const p=products.find(x=>[idOf(x),x.identification?.sku,x.identification?.manufacturerReference,x.name].filter(Boolean).some(v=>String(v).toLowerCase()===key));if(!p){miss++;continue}const id=idOf(p);costs[id]=cost;dirty[id]={...(dirty[id]||{}),wholesaleMarginPct:wm,contractorMarginPct:cm,retailMarginPct:rm,manualWholesalePrice:priceFromCost(cost,wm),manualContractorPrice:priceFromCost(cost,cm),manualRetailPrice:priceFromCost(cost,rm),manualSalePrice:priceFromCost(cost,rm)};ok++}
 localStorage.setItem("imperia_admin_costs",JSON.stringify(costs));$("quoteStatus").textContent="Procesados: "+ok+" · no encontrados/incorrectos: "+miss+". Pulsa Guardar cambios para publicar los precios calculados.";render();
}
async function saveAll(){
 const next={...overrides};for(const [id,v] of Object.entries(dirty)){next[id]={...(next[id]||{}),...(v.manualWholesalePrice?{manualWholesalePrice:Math.round(v.manualWholesalePrice)}:{}),...(v.manualContractorPrice?{manualContractorPrice:Math.round(v.manualContractorPrice)}:{}),...(v.manualRetailPrice?{manualRetailPrice:Math.round(v.manualRetailPrice),manualSalePrice:Math.round(v.manualRetailPrice)}:{}),...(v.manualMarginPct!=null?{manualMarginPct:v.manualMarginPct}:{}),...(v.wholesaleMarginPct!=null?{wholesaleMarginPct:v.wholesaleMarginPct}:{}),...(v.contractorMarginPct!=null?{contractorMarginPct:v.contractorMarginPct}:{}),...(v.retailMarginPct!=null?{retailMarginPct:v.retailMarginPct}:{}),updatedAt:new Date().toISOString(),updatedBy:"Administrador IMPERIA 360"}}
 const payload={version:"2.0.0",updatedAt:new Date().toISOString(),overrides:next};
 const current=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH+"?ref="+BRANCH);
 const b= btoa(unescape(encodeURIComponent(JSON.stringify(payload,null,2)+"\n")));
 const result=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+OVERRIDE_PATH,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"admin: actualizar precios y márgenes masivos",content:b,sha:current.sha,branch:BRANCH})});
 overrides=next;dirty={};window._sha=result.content?.sha;render();$("summary").textContent=products.length.toLocaleString("es-CO")+" productos cargados · "+Object.keys(overrides).length+" con precios IMPERIA guardados.";alert("Cambios guardados correctamente.");
}
$("loginBtn").onclick=async()=>{token=$("token").value.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g,"").trim();$("loginBtn").disabled=true;$("loginStatus").textContent="Verificando…";try{await verify();await load();renderCats();render();$("loginView").hidden=true;$("appView").hidden=false}catch(e){token="";$("loginStatus").textContent="Acceso rechazado: "+e.message;$("loginBtn").disabled=false}};
$("logoutBtn").onclick=()=>{location.reload()};$("search").oninput=()=>{page=1;render()};$("category").onchange=()=>{page=1;render()};$("prev").onclick=()=>{page--;render()};$("next").onclick=()=>{page++;render()};$("selectAll").onchange=e=>document.querySelectorAll(".pick").forEach(x=>x.checked=e.target.checked);$("applyMargins").onclick=applyMargins;$("saveAll").onclick=()=>saveAll().catch(e=>alert("No se pudo guardar: "+e.message));$("quoteBtn").onclick=()=>{$("quotePanel").hidden=!$("quotePanel").hidden};$("processQuote").onclick=processQuote;
