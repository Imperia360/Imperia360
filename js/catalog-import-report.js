/* Construye reportes de validación sin modificar los datos de entrada. */

export function createImportReport(records = [], validators = {}) {
  const report = { total: Array.isArray(records) ? records.length : 0, valid: 0, incomplete: 0, possibleDuplicates: 0, issues: [] };
  if (!Array.isArray(records)) return { ...report, issues: ['La carga debe ser un arreglo.'] };

  records.forEach((record, index) => {
    const result = validators.record ? validators.record(record) : { valid: true, issues: [], missingFields: [] };
    if (result.valid) report.valid += 1;
    if (result.missingFields?.length) report.incomplete += 1;
    if (result.issues?.length) report.issues.push({ index, issues: result.issues, missingFields: result.missingFields ?? [] });
  });

  const duplicateResults = validators.duplicates ? validators.duplicates(records) : [];
  report.possibleDuplicates = duplicateResults.filter((item) => item.status === 'possible_duplicate').length;
  return report;
}
