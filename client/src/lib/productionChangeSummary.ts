import { compareTeamName } from "@shared/teamOrder";

export type ProductionChangeSummaryRow = { unit: string; periodLabel: string; totalImport: number; totalExport: number };

type Summary = { label: string; totalImport: number; totalExport: number; differenceKg: number };

const summaryFrom = (label: string, rows: ProductionChangeSummaryRow[]): Summary => {
  const exportKeys = new Set<string>();
  const totalImport = rows.reduce((sum, row) => sum + row.totalImport, 0);
  const totalExport = rows.reduce((sum, row) => {
    const key = `${row.unit}::${row.periodLabel}`;
    if (exportKeys.has(key)) return sum;
    exportKeys.add(key);
    return sum + row.totalExport;
  }, 0);
  return { label, totalImport, totalExport, differenceKg: totalImport - totalExport };
};

export function summarizeProductionChangeRows(rows: ProductionChangeSummaryRow[]): Summary[] {
  const byUnit = new Map<string, ProductionChangeSummaryRow[]>();
  rows.forEach(row => byUnit.set(row.unit, [...(byUnit.get(row.unit) ?? []), row]));
  return [summaryFrom("Tổng chung", rows), ...Array.from(byUnit.entries()).sort(([left], [right]) => compareTeamName(left, right)).map(([unit, unitRows]) => summaryFrom(unit, unitRows))];
}
