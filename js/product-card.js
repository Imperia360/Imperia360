export function productCard(product={}) {
  const c=document.createElement('article');
  c.className='card product-card';
  if(product.images?.primary){
    const i=document.createElement('img');
    i.className='product-image';
    i.src=product.images.primary;
    i.alt=product.images.alt ?? product.name ?? '';
    i.loading='lazy';
    i.onerror=()=>{ i.style.display='none'; c.classList.add('image-error'); };
    c.append(i);
  } else {
    const p=document.createElement('div');
    p.className='product-image image-pending';
    p.setAttribute('role','img');
    p.setAttribute('aria-label','Imagen pendiente de verificación');
    p.textContent='Imagen pendiente';
    c.append(p);
  }
  if(product.name){
    const h=document.createElement('h3');
    h.textContent=product.name;
    c.append(h);
  }
  [['brand.name','Marca'],['identification.manufacturerReference','Referencia'],['identification.sku','SKU'],['measurements.originalText','Medida'],['availability.status','Disponibilidad']].forEach(([path,label])=>{
    const v=path.split('.').reduce((x,k)=>x?.[k],product);
    if(v){ const p=document.createElement('p'); p.textContent=label+': '+v; c.append(p); }
  });
  if(product.pricing?.status==='validated' && product.pricing.publicPrice!=null){
    const p=document.createElement('strong'); p.textContent=(product.pricing.currency??'')+' '+product.pricing.publicPrice.toLocaleString('es-CO'); c.append(p);
  } else if(product.pricing?.status==='quote_only'){
    const p=document.createElement('strong'); p.textContent='Precio: Cotizar'; c.append(p);
    const ref=product.pricing?.sourceReferencePrice;
    if(ref?.min!=null && ref.min>0){
      const rp=document.createElement('small'); rp.className='market-reference-price';
      const shown=ref.min===ref.max ? ref.min.toLocaleString('es-CO') : `${ref.min.toLocaleString('es-CO')} – ${ref.max.toLocaleString('es-CO')}`;
      rp.textContent='Referencia de mercado: COP '+shown;
      c.append(rp);
    }
    const n=document.createElement('small'); n.className='price-note'; n.textContent='Referencia pública; no es precio de venta IMPERIA.'; c.append(n);
  } else {
    const p=document.createElement('small'); p.className='price-pending'; p.textContent='Precio: por verificar'; c.append(p);
  }
  if(product.publicationStatus==='review'){ const s=document.createElement('small'); s.className='review-badge'; s.textContent='Registro recuperado · en revisión'; c.append(s); }
  return c;
}
