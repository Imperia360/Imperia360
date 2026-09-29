export function productCard(product={}) {
  const c=document.createElement('article');
  c.className='card product-card';

  const imageWrap=document.createElement('div');
  imageWrap.className='product-image-wrap';

  if(product.images?.primary){
    const i=document.createElement('img');
    i.className='product-image';
    i.src=product.images.primary;
    i.alt=product.images.alt ?? product.name ?? '';
    i.loading='lazy';
    i.decoding='async';
    i.onerror=()=>{
      i.remove();
      imageWrap.classList.add('image-error');
      const p=document.createElement('div');
      p.className='product-image image-pending';
      p.setAttribute('role','img');
      p.setAttribute('aria-label','Imagen no disponible en este momento');
      p.textContent='Imagen no disponible';
      imageWrap.append(p);
    };
    imageWrap.append(i);
  } else {
    const p=document.createElement('div');
    p.className='product-image image-pending';
    p.setAttribute('role','img');
    p.setAttribute('aria-label','Imagen pendiente de verificación');
    p.textContent='Imagen pendiente';
    imageWrap.append(p);
  }
  c.append(imageWrap);

  const badges=document.createElement('div');
  badges.className='product-badges';
  if(product.category){
    const b=document.createElement('span');
    b.className='product-badge';
    b.textContent=product.category;
    badges.append(b);
  }
  if(product.publicationStatus==='review'){
    const b=document.createElement('span');
    b.className='product-badge review-badge';
    b.textContent='En revisión';
    badges.append(b);
  }
  if(badges.childElementCount) c.append(badges);

  if(product.name){
    const h=document.createElement('h3');
    h.textContent=product.name;
    c.append(h);
  }

  [['brand.name','Marca'],['identification.manufacturerReference','Referencia'],['identification.sku','SKU'],['measurements.originalText','Medida'],['availability.status','Disponibilidad']].forEach(([path,label])=>{
    const v=path.split('.').reduce((x,k)=>x?.[k],product);
    if(v){ const p=document.createElement('p'); p.textContent=label+': '+v; c.append(p); }
  });

  if(product.pricing?.manualSalePrice!=null && Number(product.pricing.manualSalePrice)>0){
    const p=document.createElement('strong');
    p.textContent='Precio IMPERIA: '+(product.pricing.currency??'COP')+' '+Number(product.pricing.manualSalePrice).toLocaleString('es-CO');
    c.append(p);
    const m=product.pricing?.sourceReferencePrice;
    if(m?.min!=null && m.min>0){
      const rp=document.createElement('small'); rp.className='market-reference-price';
      const shown=m.min===m.max?m.min.toLocaleString('es-CO'):`${m.min.toLocaleString('es-CO')} – ${m.max.toLocaleString('es-CO')}`;
      rp.textContent='Referencia de mercado: COP '+shown; c.append(rp);
    }
    const n=document.createElement('small'); n.className='price-note';
    n.textContent=product.pricing?.pricingStatus==='calculated_from_market_reference'
      ? 'Precio IMPERIA calculado con margen comercial; base: referencia pública de mercado. No es costo confirmado de proveedor.'
      : 'Precio definido por IMPERIA; la referencia pública no es el precio de venta.';
    c.append(n);
  } else if(product.pricing?.status==='validated' && product.pricing.publicPrice!=null){
    const p=document.createElement('strong');
    p.textContent=(product.pricing.currency??'COP')+' '+product.pricing.publicPrice.toLocaleString('es-CO');
    c.append(p);
  } else if(product.pricing?.status==='quote_only'){
    const p=document.createElement('strong'); p.textContent='Precio: Cotizar'; c.append(p);
    const ref=product.pricing?.sourceReferencePrice;
    if(ref?.min!=null && ref.min>0){
      const rp=document.createElement('small');
      rp.className='market-reference-price';
      const shown=ref.min===ref.max ? ref.min.toLocaleString('es-CO') : `${ref.min.toLocaleString('es-CO')} – ${ref.max.toLocaleString('es-CO')}`;
      rp.textContent='Referencia de mercado: COP '+shown;
      c.append(rp);
    }
    const n=document.createElement('small');
    n.className='price-note';
    n.textContent='Referencia pública; no es precio de venta IMPERIA.';
    c.append(n);
  } else {
    const p=document.createElement('small');
    p.className='price-pending';
    p.textContent='Precio: por verificar';
    c.append(p);
  }

  if(product.images?.verificationStatus==='verified_source_image'){
    const s=document.createElement('small');
    s.className='image-verified';
    s.textContent='✓ Imagen verificada';
    c.append(s);
  }

  const actions=document.createElement('div');
  actions.className='product-actions';
  if(product.images?.sourcePage){
    const a=document.createElement('a');
    a.className='btn light';
    a.href=product.images.sourcePage;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.textContent='Ver fuente de imagen';
    actions.append(a);
  }
  const cart=document.createElement('button');
  cart.type='button';
  cart.className='btn gold';
  cart.textContent='🛒 Añadir al carrito';
  cart.disabled=false;
  cart.removeAttribute('disabled');
  cart.setAttribute('aria-disabled','false');
  cart.style.pointerEvents='auto';
  cart.dataset.cartProduct=JSON.stringify({id:product.id??'',name:product.name??'',price:product.pricing?.manualSalePrice??(product.pricing?.status==='validated'?product.pricing.publicPrice:null),currency:product.pricing?.currency??'COP',status:product.pricing?.status??'quote_only',reference:product.identification?.manufacturerReference??product.identification?.sku??''});
  cart.addEventListener('click',()=>{cart.textContent='✓ Añadido al carrito';setTimeout(()=>{cart.textContent='🛒 Añadir al carrito'},1200)});
  actions.append(cart);

  const contact=document.createElement('a');
  contact.className='btn green';
  contact.href='https://wa.me/573229667868?text='+encodeURIComponent('Hola IMPERIA 360, quiero cotizar: '+(product.name||'producto'));
  contact.target='_blank';
  contact.rel='noopener noreferrer';
  contact.textContent='Cotizar';
  actions.append(contact);
  c.append(actions);

  return c;
}
