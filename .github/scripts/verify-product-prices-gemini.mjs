import fs from "node:fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("GEMINI_API_KEY not configured; product verification skipped.");
  process.exit(0);
}

const products = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
const candidates = products.filter(p => {
  const pr = p?.pricing || {};
  const ref = p?.identification?.manufacturerReference || p?.identification?.supplierReference || p?.identification?.sku;
  return pr.status === "quote_only" && ref;
}).slice(0, 12);

const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

async function verify(p) {
  const ref = p.identification?.manufacturerReference || p.identification?.supplierReference || p.identification?.sku || "";
  const query = [p.brand?.name, p.name, ref, p.presentation].filter(Boolean).join(" ");
  const prompt = [
    "Verifica un producto real para un catálogo colombiano de ferretería.",
    "Usa Google Search y encuentra una página pública actual de fabricante, distribuidor, importador o tienda que corresponda EXACTAMENTE al producto.",
    "Solo acepta coincidencia fuerte por referencia/SKU; si no existe referencia, exige coincidencia fuerte de nombre + marca + presentación.",
    "NO inventes datos. Si no encuentras coincidencia exacta, devuelve verified=false.",
    "El precio debe ser un precio público observado en la fuente, en COP, y no una estimación.",
    "Devuelve SOLO JSON con: verified, name, brand, reference, presentation, publicPrice, currency, sourceUrl, sourceTitle, confidence.",
    "Producto a verificar: " + query
  ].join("\n");

  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method:"POST",
    headers:{"x-goog-api-key":apiKey,"content-type":"application/json"},
    body:JSON.stringify({
      model:"gemini-3.8-flash",
      input:prompt,
      tools:[{type:"google_search"}],
      response_format:{
        type:"text",
        mime_type:"application/json",
        schema:{
          type:"object",
          properties:{
            verified:{type:"boolean"},
            name:{type:"string"},
            brand:{type:"string"},
            reference:{type:"string"},
            presentation:{type:"string"},
            publicPrice:{type:"number"},
            currency:{type:"string"},
            sourceUrl:{type:"string"},
            sourceTitle:{type:"string"},
            confidence:{type:"number"}
          },
          required:["verified","name","reference","publicPrice","currency","sourceUrl","confidence"]
        }
      }
    })
  });
  if (!r.ok) return null;
  const d = await r.json();
  const out = (d.steps || []).filter(x => x.type === "model_output").flatMap(x => x.content || []).find(x => x.type === "text");
  if (!out?.text) return null;
  try { return JSON.parse(out.text); } catch { return null; }
}

let verifiedCount=0;
for (const p of candidates) {
  const v=await verify(p);
  if (!v?.verified || v.confidence < 0.95 || !v.sourceUrl || !Number.isFinite(v.publicPrice) || v.publicPrice <= 0) continue;
  const ref=norm(p.identification?.manufacturerReference || p.identification?.supplierReference || p.identification?.sku);
  const vref=norm(v.reference);
  const pname=norm(p.name);
  const vname=norm(v.name);
  if (ref && vref && ref !== vref) continue;
  if (!ref && (!pname || !vname || !(vname.includes(pname) || pname.includes(vname)))) continue;
  p.pricing = {
    ...(p.pricing || {}),
    status:"verified_public_price",
    publicPrice:Math.round(v.publicPrice),
    currency:"COP",
    priceSource:v.sourceUrl,
    priceSourceTitle:v.sourceTitle || "",
    priceVerifiedAt:new Date().toISOString(),
    verificationMethod:"gemini-3.8-flash-google-search",
    verificationConfidence:v.confidence
  };
  p.evidence = {
    ...(p.evidence || {}),
    priceSource:v.sourceUrl,
    priceSourceTitle:v.sourceTitle || "",
    verifiedAt:new Date().toISOString()
  };
  verifiedCount++;
}

fs.writeFileSync("data/products.json",JSON.stringify(products,null,2)+"\n");
console.log(JSON.stringify({candidates:candidates.length,verifiedCount},null,2));
