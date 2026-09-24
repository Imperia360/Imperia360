import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const control = JSON.parse(fs.readFileSync('data/catalog-control.json', 'utf8'));

const norm = (v='') => String(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const byId = new Map();
const byKey = new Map();
const issues = [];

products.forEach((p, index) => {
  const id = p.id ?? '';
  const name = p.name ?? p.nombre ?? '';
  const brand = p.brand ?? p.marca ?? '';
  const measure = JSON.stringify(p.measurements ?? p.medidas ?? '');
  if (!id) issues.push({type:'MISSING_ID', index, name});
  else if (byId.has(id)) issues.push({type:'DUPLICATE_ID', index, id, previousIndex:byId.get(id)});
  else byId.set(id,index);
  if (!name) issues.push({type:'MISSING_NAME', index, id});
  const key = [norm(name),norm(brand),norm(measure)].join('|');
  if (name && byKey.has(key)) issues.push({type:'POSSIBLE_DUPLICATE',index,id,name,previousIndex:byKey.get(key)});
  else if (name) byKey.set(key,index);
  if (p.price === 0 || p.precio === 0) issues.push({type:'ZERO_PRICE',index,id,name});
});

const report = {version:'1.0.0',generatedAt:new Date().toISOString(),masterProducts:products.length,configuredLoadedProducts:control.currentLoadedProducts,issuesCount:issues.length,duplicateIds:issues.filter(x=>x.type==='DUPLICATE_ID').length,possibleDuplicates:issues.filter(x=>x.type==='POSSIBLE_DUPLICATE').length,missingRequiredIdentity:issues.filter(x=>x.type==='MISSING_ID'||x.type==='MISSING_NAME').length,zeroPrices:issues.filter(x=>x.type==='ZERO_PRICE').length,issues};
fs.writeFileSync('data/catalog-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({masterProducts:report.masterProducts,issues:report.issuesCount,duplicateIds:report.duplicateIds,possibleDuplicates:report.possibleDuplicates}));