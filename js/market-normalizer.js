const UNIT_ALIASES = {
  und: 'unidad', unidad: 'unidad', unidades: 'unidad',
  kg: 'kg', kilo: 'kg', kilos: 'kg',
  g: 'g', gramo: 'g', gramos: 'g',
  m: 'metro', mt: 'metro', metro: 'metro', metros: 'metro',
  m2: 'm2', 'm²': 'm2',
  m3: 'm3', 'm³': 'm3',
  lt: 'litro', l: 'litro', litro: 'litro', litros: 'litro',
  gal: 'galon', galon: 'galon', galones: 'galon',
  caja: 'caja', cajas: 'caja', paquete: 'paquete', paquetes: 'paquete',
  rollo: 'rollo', rollos: 'rollo', bulto: 'bulto', bultos: 'bulto',
  par: 'par', juego: 'juego', docena: 'docena'
};

export function normalizeText(value = '') {
  return String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/\\s+/g, ' ').trim();
}

export function normalizeUnit(value = '') {
  const key = normalizeText(value).replace(/\\./g, '');
  return UNIT_ALIASES[key] || key || null;
}

export function normalizeOffer(raw = {}) {
  const presentation = raw.presentation || {};
  return {
    source: raw.source || null,
    sourceUrl: raw.sourceUrl || null,
    consultedAt: raw.consultedAt || null,
    originalProductName: raw.originalProductName || raw.name || null,
    normalizedName: normalizeText(raw.name || raw.originalProductName || ''),
    brand: raw.brand || null,
    reference: raw.reference || raw.sku || null,
    presentation: {
      original: presentation.original || raw.presentationText || null,
      quantity: Number.isFinite(Number(presentation.quantity)) ? Number(presentation.quantity) : null,
      unit: normalizeUnit(presentation.unit || raw.unit || '')
    },
    price: {
      amount: Number.isFinite(Number(raw.price)) ? Number(raw.price) : null,
      currency: raw.currency || 'COP',
      status: raw.priceStatus || (raw.price != null ? 'unvalidated' : 'quote_only')
    }
  };
}

export function unitPrice(amount, quantity) {
  if (!Number.isFinite(Number(amount)) || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return null;
  return Number(amount) / Number(quantity);
}
