import { comparePeriodLabel, compareTeamName } from "../shared/teamOrder";

export type WarehouseImport = { unit: string; periodLabel: string; totalImport: number; recordDate?: Date };
export type WarehouseExport = { unit: string; periodLabel: string; totalExport: number; recordDate?: Date };

const monthLabelOf = (recordDate?: Date) => recordDate ? `${recordDate.getUTCMonth() + 1}/${recordDate.getUTCFullYear()}` : null;

export function aggregateWarehouseLoss(imports: WarehouseImport[], exports: WarehouseExport[], periodLabel?: string, monthLabel?: string) {
  const grouped = new Map<string, { unit: string; periodLabel: string; totalImport: number; totalExport: number }>();
  const upsert = (unit: string, period: string) => { const key = `${unit}::${period}`; const value = grouped.get(key) ?? { unit, periodLabel: period, totalImport: 0, totalExport: 0 }; grouped.set(key, value); return value; };
  const matches = (row: WarehouseImport | WarehouseExport) => (!periodLabel || row.periodLabel === periodLabel) && (!monthLabel || monthLabelOf(row.recordDate) === monthLabel);
  imports.filter(matches).forEach(row => { upsert(row.unit, row.periodLabel).totalImport += row.totalImport; });
  exports.filter(matches).forEach(row => { upsert(row.unit, row.periodLabel).totalExport += row.totalExport; });
  const rows = Array.from(grouped.values()).map(row => ({ ...row, lossKg: row.totalImport - row.totalExport, lossPercent: row.totalImport > 0 ? ((row.totalImport - row.totalExport) / row.totalImport) * 100 : 0 })).sort((a, b) => comparePeriodLabel(b.periodLabel, a.periodLabel) || compareTeamName(a.unit, b.unit));
  const totalImport = rows.reduce((sum, row) => sum + row.totalImport, 0); const totalExport = rows.reduce((sum, row) => sum + row.totalExport, 0);
  const monthFilteredRecords = [...imports, ...exports].filter(row => !monthLabel || monthLabelOf(row.recordDate) === monthLabel);
  const periods = Array.from(new Set(monthFilteredRecords.map(row => row.periodLabel))).sort((a, b) => comparePeriodLabel(b, a));
  const months = Array.from(new Set([...imports, ...exports].map(row => monthLabelOf(row.recordDate)).filter((value): value is string => Boolean(value)))).sort((a, b) => { const [aMonth, aYear] = a.split("/").map(Number); const [bMonth, bYear] = b.split("/").map(Number); return bYear - aYear || bMonth - aMonth; });
  return { rows, periods, months, totals: { totalImport, totalExport, lossKg: totalImport - totalExport, lossPercent: totalImport > 0 ? ((totalImport - totalExport) / totalImport) * 100 : 0 } };
}
