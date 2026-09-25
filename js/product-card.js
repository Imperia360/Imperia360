export function productCard(product={}) {
  const c=document.createElement('article');
  c.className='card product-card';
  if(product.images?.primary){
    const i=document.createElement('img');
    i.className='product-image';
    i.src=product.images.primary;
    i.alt=product.images.alt ?? product.name ?? '';
    i.loading='lazy';
    i.onerror=()=>{ i.style.display='none'; };
    c.append(i);
  }
  if(product.name){
    const h=document.createElement('h3');
    h.textContent=product.name;
    c.append(h);
  }
  [['brand.name','Marca'],['identification.manufacturerReference','Referencia'],['identification.sku','SKU'],['measurements.originalText','Medida'],['availability.status','Disponibilidad']].forEach(([path,label])=>{
    const v=path.split('.').reduce((x,k)=>x?.[k],product);
    if(v){
      const p=document.createElement('p');
      p.textContent=`${label}: ${v}`;
      c.append(p);
    }
  });
  if(product.pricing?.status==='validated' && product.pricing.publicPrice!=null){
    const p=document.createElement('strong');
    p.textContent=`${product.pricing.currency??''} ${product.pricing.publicPrice.toLocaleString('es-CO')}`;
    c.append(p);
  } else if(product.pricing?.status==='quote_only'){
    const p=document.createElement('strong');
    p.textContent='Precio: Cotizar';
    c.append(p);
    if(product.pricing.note){
      const small=document.createElement('small');
      small.textContent='Precio final sujeto a cotización y verificación de costo.';
      c.append(small);
    }
  }
  return c;
}
