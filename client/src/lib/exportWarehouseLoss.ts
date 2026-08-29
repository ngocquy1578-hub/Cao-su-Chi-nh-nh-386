export function calculateProjectedWarehouseLoss(totalImport: number, recordedExport: number, draftExport: number) {
  const projectedExport = Math.max(0, recordedExport) + Math.max(0, draftExport);
  return {
    projectedExport,
    lossKg: Math.max(0, Math.max(0, totalImport) - projectedExport),
    exceedsImportKg: Math.max(0, projectedExport - Math.max(0, totalImport)),
  };
}
