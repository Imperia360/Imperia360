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
    p.setAttribute('aria-label','Imagen no disponible');
    p.textContent='Imagen no disponible';
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
  if(badges.childElementCount) c.append(badges);

  if(product.name){
    const h=document.createElement('h3');
    h.textContent=product.name;
    c.append(h);
  }

  [['brand.name','Marca'],['identification.manufacturerReference','Referencia'],['identification.sku','SKU'],['measurements.originalText','Medida']].forEach(([path,label])=>{
    const v=path.split('.').reduce((x,k)=>x?.[k],product);
    if(v){ const p=document.createElement('p'); p.textContent=label+': '+v; c.append(p); }
  });

  if(product.pricing?.manualSalePrice!=null && Number(product.pricing.manualSalePrice)>0){
    const p=document.createElement('strong');
    p.textContent='Precio IMPERIA: '+(product.pricing.currency??'COP')+' '+Number(product.pricing.manualSalePrice).toLocaleString('es-CO');
    c.append(p);

  } else {
    const p=document.createElement('small');
    p.className='price-pending';
    p.textContent='Precio: por verificar';
    c.append(p);
  }


  const actions=document.createElement('div');
  actions.className='product-actions';
  const cart=document.createElement('button');
  cart.type='button';
  cart.className='btn gold';
  cart.textContent='🛒 Añadir al carrito';
  cart.disabled=false;
  cart.removeAttribute('disabled');
  cart.setAttribute('aria-disabled','false');
  cart.style.pointerEvents='auto';
  cart.dataset.cartProduct=JSON.stringify({id:product.id??'',name:product.name??'',price:product.pricing?.manualSalePrice??(product.pricing?.status==='validated'?product.pricing.publicPrice:null),currency:product.pricing?.currency??'COP',status:product.pricing?.status??'quote_only',reference:product.identification?.manufacturerReference??product.identification?.sku??''});
  cart.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();const p=JSON.parse(cart.dataset.cartProduct||'{}');if(typeof window.imperia360AddToCart==='function'){window.imperia360AddToCart(p);}else{const key='imperia360_cart_v1';let items=[];try{items=JSON.parse(localStorage.getItem(key)||'[]')}catch{}const found=items.find(x=>x.id===p.id&&x.name===p.name);if(found)found.qty++;else items.push({...p,qty:1});localStorage.setItem(key,JSON.stringify(items));}cart.textContent='✓ Añadido al carrito';setTimeout(()=>{cart.textContent='🛒 Añadir al carrito'},1200);});
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
