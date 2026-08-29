export function calculateLatexTotals(totalImport: number, totalExport: number) {
  const safeImport = Number.isFinite(totalImport) ? totalImport : 0;
  const safeExport = Number.isFinite(totalExport) ? totalExport : 0;
  return {
    totalImport: safeImport,
    totalExport: safeExport,
    lossRate: safeImport > 0 ? ((safeImport - safeExport) / safeImport) * 100 : 0,
  };
}
