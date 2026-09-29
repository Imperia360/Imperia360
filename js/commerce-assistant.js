(async function(){
  const CONFIG='./data/commerce-config.json?'+Date.now();
  const WA='573229667868';
  let products=[];
  function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}
  function price(p){return Number(p?.pricing?.manualSalePrice||p?.pricing?.manualRetailPrice||0);}
  function search(q){const t=norm(q).split(/\\s+/).filter(x=>x.length>1);return products.map(p=>{const h=norm([p.name,p.identification?.sku,p.identification?.manufacturerReference,p.identification?.supplierReference,p.brand?.name,p.category?.name,p.presentation].join(' '));return {p,s:t.filter(x=>h.includes(x)).length};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.p);}
  async function load(){try{const r=await fetch('./data/products.json');products=await r.json();const p=await fetch('./data/paint-catalog-batch-2026-09-29.json?'+Date.now());if(p.ok){const d=await p.json();for(const x of (d.products||[]))if(!products.some(y=>y.id===x.id))products.push(x);}}catch(e){products=[];}}
  function wa(text){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');}
  function inject(){
    const cart=document.getElementById('cart-panel'), checkout=document.getElementById('cart-checkout'); if(!cart||!checkout)return;
    if(!document.getElementById('cart-pay-now')){
      const wrap=document.createElement('div');wrap.style.cssText='display:grid;gap:8px;margin:8px 0';
      ['cart-pay-now','cart-pay-pse','cart-pay-qr','cart-pay-whatsapp'].forEach((id,i)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=i===0?'btn green':i===1?'btn light':i===2?'btn gold':'btn light';b.style.width='100%';b.textContent=i===0?'💳 Pagar ahora':i===1?'🏦 Pagar con PSE':i===2?'▣ Pagar con QR':'💬 Continuar compra por WhatsApp';wrap.append(b);});
      checkout.parentNode.insertBefore(wrap,checkout);
      document.getElementById('cart-pay-now').onclick=()=>pay();
      document.getElementById('cart-pay-pse').onclick=()=>pay('PSE');
      document.getElementById('cart-pay-qr').onclick=()=>pay('QR');
      document.getElementById('cart-pay-whatsapp').onclick=()=>cartWhatsApp();
    }
  }
  async function pay(method){
    const cart=JSON.parse(localStorage.getItem('imperia360_cart_v1')||'[]');
    const total=cart.reduce((s,x)=>s+(x.price!=null?Number(x.price)*(Number(x.qty)||1):0),0);
    if(!total){alert('El carrito no tiene precio confirmado. No se puede iniciar un cobro automático con un precio no verificado. Puedes usar “Continuar compra por WhatsApp”.');return;}
    let cfg={};try{const r=await fetch(CONFIG);if(r.ok)cfg=await r.json();}catch(e){}
    if(!cfg?.payments?.apiBaseUrl){alert('El pago automático todavía no está conectado al backend seguro Wompi. Puedes usar “Continuar compra por WhatsApp”.');return;}
    const base=(cfg.payments.apiBaseUrl||'/api/commerce').replace(/\\/$/,'');
    const desc=cart.map(x=>(x.name||'Producto')+' x'+(x.qty||1)).join(', ');
    try{const r=await fetch(base+'?action=payment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:cart.map(x=>({id:x.id,name:x.name,sku:x.sku,reference:x.reference,qty:x.qty})),name:'Compra IMPERIA 360',description:desc,method:method||'CHECKOUT'})});const d=await r.json();if(!r.ok||!d.paymentUrl)throw new Error(d.error||'No fue posible iniciar el pago');window.open(d.paymentUrl,'_blank','noopener,noreferrer');}catch(e){alert(e.message||'No fue posible iniciar el pago.');}
  }
  function cartWhatsApp(){
    const cart=JSON.parse(localStorage.getItem('imperia360_cart_v1')||'[]');
    if(!cart.length){alert('El carrito está vacío.');return;}
    const lines=cart.map(x=>'- '+(x.name||'Producto')+' x'+(x.qty||1)+(x.reference?' | Ref. '+x.reference:''));
    const total=cart.reduce((s,x)=>s+(x.price!=null?Number(x.price)*(Number(x.qty)||1):0),0);
    const msg='Hola IMPERIA 360. Quiero continuar mi compra por WhatsApp.\\n\\n'+lines.join('\\n')+'\\n\\nTotal mostrado: '+(total?'COP '+total.toLocaleString('es-CO'):'por confirmar')+'\\nPor favor confirmen disponibilidad y despacho.';
    wa(msg);
  }
  function assistant(){
    if(document.getElementById('imperia-ai-box'))return;
    const b=document.createElement('button');b.id='imperia-ai-open';b.textContent='🤖 Asistente IA';b.className='wa';b.style.bottom='130px';document.body.append(b);
    const box=document.createElement('div');box.id='imperia-ai-box';box.style.cssText='position:fixed;right:18px;bottom:185px;z-index:10005;width:min(440px,calc(100vw - 36px));background:#fff;border:1px solid #dfe7ed;border-radius:20px;box-shadow:0 24px 70px #0005;padding:18px;display:none';
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><strong>Asistente IA IMPERIA 360</strong><button id="imperia-ai-close" class="btn light" type="button">Cerrar</button></div><p style="color:#647487;font-size:13px">Busca en el catálogo, muestra el precio publicado y prepara la compra.</p><input id="imperia-ai-input" placeholder="Producto, marca, referencia o medida" style="width:100%;padding:12px;border:1px solid #dfe7ed;border-radius:10px"><button id="imperia-ai-search" class="btn green" style="width:100%;margin-top:8px" type="button">Buscar</button><div id="imperia-ai-results"></div>';
    document.body.append(box);b.onclick=()=>{box.style.display='block';document.getElementById('imperia-ai-input').focus();};document.getElementById('imperia-ai-close').onclick=()=>box.style.display='none';
    document.getElementById('imperia-ai-search').onclick=()=>{const list=search(document.getElementById('imperia-ai-input').value),out=document.getElementById('imperia-ai-results');out.replaceChildren();if(!list.length){out.textContent='No encontré una coincidencia exacta. Prueba con SKU o referencia.';return;}list.forEach(p=>{const d=document.createElement('div');d.style.cssText='padding:12px 0;border-bottom:1px solid #dfe7ed';const s=document.createElement('strong');s.textContent=p.name;d.append(s);const q=document.createElement('p');q.textContent=price(p)?'COP '+price(p).toLocaleString('es-CO'):'Precio por confirmar';d.append(q);const x=document.createElement('button');x.className='btn green';x.type='button';x.textContent='Comprar por WhatsApp';x.onclick=()=>wa('Hola IMPERIA 360. Quiero comprar '+p.name+(p.identification?.manufacturerReference?' | Ref. '+p.identification.manufacturerReference:'')+(price(p)?' | Precio publicado COP '+price(p).toLocaleString('es-CO'):' | Precio por confirmar'));d.append(x);out.append(d);});};
  }
  await load(); inject(); assistant(); new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();