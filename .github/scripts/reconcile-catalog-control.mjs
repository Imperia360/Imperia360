import fs from 'node:fs/promises';

const PRODUCTS='data/products.json';
const IMAGES='data/product-images.json';
const CONTROL='data/catalog-control.json';

const products=JSON.parse(await fs.readFile(PRODUCTS,'utf8'));
const images=JSON.parse(await fs.readFile(IMAGES,'utf8'));
const control=JSON.parse(await fs.readFile(CONTROL,'utf8'));

const productRecords=Array.isArray(products)?products:(products.products||[]);
const records=Array.isArray(images.records)?images.records:[];
const ids=records.map(r=>String(r?.productId||'')).filter(Boolean);
const uniqueIds=new Set(ids);
const blocked=records.filter(r=>/sofalca\.com/i.test(String(r?.imageUrl||''))||/sofalca\.com/i.test(String(r?.sourcePage||''))||/^sofalca$/i.test(String(r?.source||'')));
const duplicateIds=ids.filter((id,i)=>ids.indexOf(id)!==i);
const publishable=records.filter(r=>r?.publishable===true&&!blocked.includes(r));
const verified=records.filter(r=>r?.verificationStatus==='verified_source_image'&&!blocked.includes(r));

control.currentLoadedProducts=productRecords.length;
control.imagePolicy=control.imagePolicy||{};
control.imagePolicy.currentMasterAudit={
  products:productRecords.length,
  withImage:records.length,
  withoutImage:Math.max(0,productRecords.length-records.length),
  uniqueProductIds:uniqueIds.size,
  duplicateProductIds:new Set(duplicateIds).size,
  publishableImages:publishable.length,
  verifiedSourceImages:verified.length,
  blockedSourceImages:blocked.length,
  blockedSourceImagePolicy:'sofalca.com'
};
control.imagePolicy.lastReconciledAt=new Date().toISOString().slice(0,10);
control.imagePolicy.reconciliationSource='data/products.json + data/product-images.json';
control.lastExecution=new Date().toISOString().slice(0,10);
control.executionStatus='executed_rules_hardened';
control.lastExecutionEvidence=control.lastExecutionEvidence||{};
control.lastExecutionEvidence.imageAudit=`${records.length} registros de imagen; ${uniqueIds.size} productId únicos; ${publishable.length} publicables; ${verified.length} verificados; ${blocked.length} bloqueados por fuente.`;
control.lastExecutionEvidence.repositoryImprovement='Control maestro reconciliado automáticamente contra los archivos reales; las fuentes bloqueadas se conservan para trazabilidad y no se publican.';
await fs.writeFile(CONTROL,JSON.stringify(control,null,2)+'\n');
console.log(JSON.stringify({products:productRecords.length,images:records.length,uniqueProductIds:uniqueIds.size,duplicateProductIds:new Set(duplicateIds).size,publishableImages:publishable.length,verifiedSourceImages:verified.length,blockedSourceImages:blocked.length},null,2));