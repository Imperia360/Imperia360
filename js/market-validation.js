import { normalizeOffer } from './market-normalizer.js';
import { matchOfferToCatalog } from './market-matcher.js';

export function validateMarketBatch(rawOffers = [], products = []) {
  const results = [];
  for (const raw of rawOffers) {
    const offer = normalizeOffer(raw);
    const match = matchOfferToCatalog(offer, products);
    results.push({ offer, match });
  }
  return results;
}
