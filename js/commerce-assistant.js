(async function(){
  const CONFIG='./data/commerce-config.json?'+Date.now();
  const WA='573229667868';
  let products=[];
  const KEY='imperia360_cart_v1';

  function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}
  function price(p){return Number(p?.pricing?.manualSalePrice||p?.pricing?.manualRetailPrice||0);}
  function search(q){const t=norm(q).split(/\\s+/).filter(x=>x.length>1);return products.map(p=>{const h=norm([p.name,p.identification?.sku,p.identification?.manufacturerReference,p.identification?.supplierReference,p.brand?.name,p.category?.name,p.presentation].join(' '));return {p,s:t.filter(x=>h.includes(x)).length};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.p);}
  async function load(){try{const r=await fetch('./data/products.json');products=await r.json();const p=await fetch('./data/paint-catalog-batch-2026-09-29.json?'+Date.now());if(p.ok){const d=await p.json();for(const x of (d.products||[]))if(!products.some(y=>y.id===x.id))products.push(x);}}catch(e){products=[];}}
  function wa(text){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');}
  function cart(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[];}}
  function money(n){return Number(n||0).toLocaleString('es-CO');}

  function customerModal(){
    return new Promise(resolve=>{
      let m=document.getElementById('imperia-order-modal');
      if(m)m.remove();
      m=document.createElement('div');m.id='imperia-order-modal';
      m.style.cssText='position:fixed;inset:0;background:#0008;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px';
      m.innerHTML='<div style="background:#fff;border-radius:20px;padding:20px;width:min(480px,100%);max-height:92vh;overflow:auto"><h3 style="margin-top:0">Datos para tu pedido</h3><p style="color:#647487;font-size:13px">IMPERIA 360 los usa para identificar el pedido, entrega y factura.</p><label>Nombre completo*<input id="imp-c-name" required style="width:100%;padding:11px;margin:5px 0 10px"></label><label>Teléfono / WhatsApp*<input id="imp-c-phone" required style="width:100%;padding:11px;margin:5px 0 10px"></label><label>Correo electrónico<input id="imp-c-email" type="email" style="width:100%;padding:11px;margin:5px 0 10px"></label><label>Dirección de entrega<input id="imp-c-address" style="width:100%;padding:11px;margin:5px 0 10px"></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button id="imp-c-cancel" class="btn light" type="button">Cancelar</button><button id="imp-c-ok" class="btn green" type="button">Crear pedido</button></div></div>';
      document.body.append(m);
      const done=(v)=>{m.remove();resolve(v);};
      m.querySelector('#imp-c-cancel').onclick=()=>done(null);
      m.querySelector('#imp-c-ok').onclick=()=>{
        const name=m.querySelector('#imp-c-name').value.trim(),phone=m.querySelector('#imp-c-phone').value.trim();
        if(!name||!phone){alert('Nombre y teléfono son obligatorios.');return;}
        done({name,phone,email:m.querySelector('#imp-c-email').value.trim(),address:m.querySelector('#imp-c-address').value.trim()});
      };
    });
  }

  async function createOrder(){
    const c=cart(); if(!c.length){alert('El carrito está vacío.');return null;}
    const customer=await customerModal(); if(!customer)return null;
    let cfg={};try{const r=await fetch(CONFIG);if(r.ok)cfg=await r.json();}catch(e){}
    const base=(cfg?.payments?.apiBaseUrl||'/api/commerce').replace(/\/$/,'');
    const items=c.map(x=>({id:x.id,name:x.name,sku:x.sku,reference:x.reference,qty:x.qty}));
    try{
      const r=await fetch(base+'?action=create-order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items,customer})});
      const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'No fue posible crear el pedido.');
      localStorage.setItem('imperia360_last_order',JSON.stringify(d));
      return d;
    }catch(e){alert(e.message||'No fue posible crear el pedido.');return null;}
  }

  function orderForWhatsApp(o){
    const lines=o.lines.map(x=>'- '+x.name+' x'+x.qty+' | '+money(x.lineTotal)+' COP').join('\n');
    const supplier=o.fulfillment.map(x=>'- '+x.product+' x'+x.qty+' → '+x.supplier+(x.supplierReference?' | Ref. proveedor '+x.supplierReference:'')+(x.supplierUrl?' | '+x.supplierUrl:'')).join('\n');
    return 'NUEVO PEDIDO IMPERIA 360\nOrden: '+o.orderNumber+'\nCliente: '+o.customer.name+'\nTel: '+o.customer.phone+(o.customer.address?'\nEntrega: '+o.customer.address:'')+'\n\nCOMPRA CLIENTE:\n'+lines+'\nTOTAL: COP '+money(o.total)+'\n\nABASTECIMIENTO IMPERIA (MANUAL):\n'+supplier+'\n\nEstado: '+o.status+' / '+o.paymentStatus+'\nFactura: borrador pendiente de emisión electrónica DIAN.';
  }

  function printInvoice(o){
    const lines=o.lines.map(x=>'<tr><td>'+escapeHtml(x.name)+'</td><td>'+x.qty+'</td><td>$ '+money(x.unitPrice)+'</td><td>$ '+money(x.lineTotal)+'</td></tr>').join('');
    const w=window.open('','_blank','noopener,noreferrer');
    if(!w){alert('Permite ventanas emergentes para generar el documento.');return;}
    w.document.write('<!doctype html><html><head><title>'+o.orderNumber+' - IMPERIA 360</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px;color:#172033}h1{color:#10243a}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:9px;text-align:left}.total{font-size:20px;font-weight:bold;text-align:right;margin-top:20px}.note{margin-top:24px;padding:12px;background:#f5f7fa;color:#647487}</style></head><body><h1>IMPERIA 360</h1><p>Orden: '+o.orderNumber+'</p><p><b>Cliente:</b> '+escapeHtml(o.customer.name)+'<br><b>Teléfono:</b> '+escapeHtml(o.customer.phone)+(o.customer.email?'<br><b>Correo:</b> '+escapeHtml(o.customer.email):'')+(o.customer.address?'<br><b>Entrega:</b> '+escapeHtml(o.customer.address):'')+'</p><table><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total</th></tr></thead><tbody>'+lines+'</tbody></table><div class="total">TOTAL: $ '+money(o.total)+' COP</div><div class="note"><b>Documento generado por IMPERIA 360.</b><br>Este documento es un comprobante/borrador de pedido y no sustituye la factura electrónica de venta transmitida y validada por la DIAN.</div><script>window.print();<\/script></body></html>');
    w.document.close();
  }
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  async function pay(method){
    const o=await createOrder();if(!o)return;
    if(method==='QR'){
      showQr(o);
      wa(orderForWhatsApp(o)+'\n\nEl cliente pagará mediante QR. Confirmar el comprobante antes de abastecer.');
      return;
    }
    let cfg={};try{const r=await fetch(CONFIG);if(r.ok)cfg=await r.json();}catch(e){}
    const base=(cfg?.payments?.apiBaseUrl||'/api/commerce').replace(/\/$/,'');
    const desc=o.lines.map(x=>x.name+' x'+x.qty).join(', ');
    try{
      const r=await fetch(base+'?action=payment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:o.lines.map(x=>({id:x.id,qty:x.qty})),name:o.orderNumber,description:desc,method:method||'CHECKOUT'})});
      const d=await r.json();if(!r.ok||!d.paymentUrl)throw new Error(d.error||'No fue posible iniciar el pago');
      wa(orderForWhatsApp(o)+'\n\nLink de pago Wompi: '+d.paymentUrl);
      window.open(d.paymentUrl,'_blank','noopener,noreferrer');
    }catch(e){alert(e.message||'No fue posible iniciar el pago.');}
  }

  function showQr(o){
    let modal=document.getElementById('imperia-qr-modal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='imperia-qr-modal';modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:10030;display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div');card.style.cssText='background:#fff;border-radius:20px;padding:20px;max-width:420px;width:100%;text-align:center';
    card.innerHTML='<h3 style="margin:0 0 8px">Pedido '+escapeHtml(o.orderNumber)+'</h3><p>Escanea el QR de IMPERIA 360 para pagar <b>COP '+money(o.total)+'</b>.</p><img src="./assets/payments/imperia360-breb-qr.png?v=1" alt="QR de pago IMPERIA 360" style="display:block;width:min(320px,90vw);height:auto;margin:0 auto 16px"><button class="btn green" type="button" style="width:100%">Ya pagué / ver comprobante</button><button class="btn light" type="button" style="width:100%;margin-top:8px">Cerrar</button>';
    modal.append(card);document.body.append(modal);
    card.querySelectorAll('button')[0].onclick=()=>{printInvoice(o);};
    card.querySelectorAll('button')[1].onclick=()=>modal.remove();
  }

  function cartWhatsApp(){pay('WHATSAPP');}
  function inject(){
    const cartEl=document.getElementById('cart-panel'),checkout=document.getElementById('cart-checkout');if(!cartEl||!checkout)return;
    if(!document.getElementById('cart-pay-now')){
      const wrap=document.createElement('div');wrap.style.cssText='display:grid;gap:8px;margin:8px 0';
      ['cart-pay-now','cart-pay-pse','cart-pay-qr','cart-pay-whatsapp'].forEach((id,i)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=i===0?'btn green':i===1?'btn light':i===2?'btn gold':'btn light';b.style.width='100%';b.textContent=i===0?'💳 Pagar ahora':i===1?'🏦 Pagar con PSE':i===2?'▣ Pagar con QR':'💬 Continuar compra por WhatsApp';wrap.append(b);});
      checkout.parentNode.insertBefore(wrap,checkout);
      document.getElementById('cart-pay-now').onclick=()=>pay();
      document.getElementById('cart-pay-pse').onclick=()=>pay('PSE');
      document.getElementById('cart-pay-qr').onclick=()=>pay('QR');
      document.getElementById('cart-pay-whatsapp').onclick=cartWhatsApp;
    }
  }

  function assistant(){
    if(document.getElementById('imperia-ai-box'))return;
    const b=document.createElement('button');b.id='imperia-ai-open';b.textContent='🤖 Asistente IA';b.className='wa';b.style.bottom='130px';document.body.append(b);
    const box=document.createElement('div');box.id='imperia-ai-box';box.style.cssText='position:fixed;right:18px;bottom:185px;z-index:10005;width:min(440px,calc(100vw - 36px));background:#fff;border:1px solid #dfe7ed;border-radius:20px;box-shadow:0 24px 70px #0005;padding:18px;display:none';
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><strong>Asistente IA IMPERIA 360</strong><button id="imperia-ai-close" class="btn light" type="button">Cerrar</button></div><p style="color:#647487;font-size:13px">Busca en el catálogo, muestra el precio publicado y prepara la compra.</p><input id="imperia-ai-input" placeholder="Producto, marca, referencia o medida" style="width:100%;padding:12px;border:1px solid #dfe7ed;border-radius:10px"><button id="imperia-ai-search" class="btn green" style="width:100%;margin-top:8px" type="button">Buscar</button><div id="imperia-ai-results"></div>';
    document.body.append(box);b.onclick=()=>{box.style.display='block';document.getElementById('imperia-ai-input').focus();};document.getElementById('imperia-ai-close').onclick=()=>box.style.display='none';
    document.getElementById('imperia-ai-search').onclick=()=>{const list=search(document.getElementById('imperia-ai-input').value),out=document.getElementById('imperia-ai-results');out.replaceChildren();if(!list.length){out.textContent='No encontré una coincidencia exacta. Prueba con SKU o referencia.';return;}list.forEach(p=>{const d=document.createElement('div');d.style.cssText='padding:12px 0;border-bottom:1px solid #dfe7ed';const s=document.createElement('strong');s.textContent=p.name;d.append(s);const q=document.createElement('p');q.textContent=price(p)?'COP '+money(price(p)):'Precio por confirmar';d.append(q);const x=document.createElement('button');x.className='btn green';x.type='button';x.textContent='Comprar por WhatsApp';x.onclick=()=>wa('Hola IMPERIA 360. Quiero comprar '+p.name+(p.identification?.manufacturerReference?' | Ref. '+p.identification.manufacturerReference:'')+(price(p)?' | Precio publicado COP '+money(price(p)):' | Precio por confirmar'));d.append(x);out.append(d);});};
  }

  await load();inject();assistant();new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();