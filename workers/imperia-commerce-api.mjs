/**
 * IMPERIA 360 Commerce API
 * Serverless/edge backend for WhatsApp + Gemini + Wompi.
 * Secrets: META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, META_VERIFY_TOKEN,
 * GEMINI_API_KEY, WOMPI_PRIVATE_KEY.
 * Vars: CATALOG_URL, SITE_URL.
 */
const H={"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"};
const ok=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:H});
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const price=p=>Number(p?.pricing?.manualSalePrice||p?.pricing?.manualRetailPrice||0);
const money=n=>Number(n||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});

async function catalog(env){
 if(!env.CATALOG_URL)return [];
 const r=await fetch(env.CATALOG_URL);
 if(!r.ok)return [];
 const d=await r.json();
 return Array.isArray(d)?d:[];
}
function findProducts(products,q){
 const t=norm(q).split(/\s+/).filter(x=>x.length>=2);
 return products.map(p=>{
   const hay=norm([p.name,p.brand?.name,p.identification?.sku,p.identification?.manufacturerReference,p.identification?.supplierReference,p.category?.name,p.presentation].join(" "));
   const hits=t.filter(x=>hay.includes(x)).length;
   return {p,score:t.length?hits/t.length:0};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.p);
}
async function askGemini(env,textIn,products){
 if(!env.GEMINI_API_KEY)return null;
 const rows=products.slice(0,30).map(p=>({id:p.id,name:p.name,sku:p.identification?.sku,ref:p.identification?.manufacturerReference,price:price(p)}));
 const prompt=["Eres el asistente de ventas de IMPERIA 360 Colombia.","Solo puedes afirmar productos y precios del catálogo.","Si no hay precio, indica precio por confirmar. No inventes disponibilidad, descuentos ni tiempos.","Responde en español, breve y orientado a cerrar la compra.","CATALOGO:",JSON.stringify(rows),"CLIENTE:",textIn].join("\n");
 const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(env.GEMINI_API_KEY),{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:500}})
 });
 if(!r.ok)return null;
 const d=await r.json();
 return d?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("").trim()||null;
}
async function sendWhatsApp(env,to,text){
 if(!env.META_ACCESS_TOKEN||!env.META_PHONE_NUMBER_ID)return false;
 const r=await fetch("https://graph.facebook.com/v23.0/"+env.META_PHONE_NUMBER_ID+"/messages",{
  method:"POST",headers:{authorization:"Bearer "+env.META_ACCESS_TOKEN,"content-type":"application/json"},
  body:JSON.stringify({messaging_product:"whatsapp",to,type:"text",text:{body:text}})
 });
 return r.ok;
}
async function createWompiLink(env,b){
 if(!env.WOMPI_PRIVATE_KEY)throw new Error("WOMPI_PRIVATE_KEY no configurada");
 const amount=Math.round(Number(b.amount||0));
 if(!Number.isFinite(amount)||amount<100)throw new Error("Monto inválido");
 const r=await fetch("https://production.wompi.co/v1/payment_links",{
  method:"POST",headers:{authorization:"Bearer "+env.WOMPI_PRIVATE_KEY,"content-type":"application/json"},
  body:JSON.stringify({name:String(b.name||"Compra IMPERIA 360").slice(0,120),description:String(b.description||"Pedido IMPERIA 360").slice(0,255),single_use:true,collect_shipping:false,currency:"COP",amount_in_cents:amount*100})
 });
 const d=await r.json();
 if(!r.ok)throw new Error(d?.error?.reason||"Wompi no pudo crear el link");
 if(!d?.data?.id)throw new Error("Wompi no devolvió el identificador del link");
 return "https://checkout.wompi.co/l/"+d.data.id;
}

export default {async fetch(request,env){
 if(request.method==="OPTIONS")return new Response("",{status:204,headers:H});
 const u=new URL(request.url);
 try{
  if(u.pathname==="/health")return ok({ok:true,service:"IMPERIA 360 Commerce API"});
  if(u.pathname==="/whatsapp/webhook"&&request.method==="GET"){
   if(u.searchParams.get("hub.mode")==="subscribe"&&u.searchParams.get("hub.verify_token")===env.META_VERIFY_TOKEN)return new Response(u.searchParams.get("hub.challenge"),{status:200});
   return new Response("forbidden",{status:403});
  }
  if(u.pathname==="/whatsapp/webhook"&&request.method==="POST"){
   const body=await request.json();
   const msg=body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
   if(!msg||msg.type!=="text")return ok({received:true});
   const from=msg.from,textIn=msg.text?.body||"",products=await catalog(env),matches=findProducts(products,textIn);
   const ai=await askGemini(env,textIn,matches.length?matches:products.slice(0,30));
   const reply=ai||(matches.length?"Hola 👋 Soy el asistente de IMPERIA 360. Encontré:\n"+matches.slice(0,3).map(p=>"- "+p.name+(price(p)?" — "+money(price(p)):" — precio por confirmar")).join("\n")+"\n\nIndícame cantidad y zona de entrega para preparar tu pedido.":"Hola 👋 Soy el asistente de IMPERIA 360. No encontré una coincidencia exacta. Envíame nombre, referencia, SKU o una foto y lo busco.");
   await sendWhatsApp(env,from,reply);
   return ok({received:true});
  }
  if(u.pathname==="/payment/create"&&request.method==="POST"){
   const b=await request.json();
   return ok({ok:true,provider:"wompi",paymentUrl:await createWompiLink(env,b)});
  }
  return ok({error:"Not found"},404);
 }catch(e){return ok({ok:false,error:e.message||"Error"},400);}
}};
