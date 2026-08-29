import { compareTeamName } from "@shared/teamOrder";
import { comparePlotsByYearAndName } from "./plotOrder";

export type PlotProductionEntry = {
  id: number;
  plotId: number;
  recordDate: Date | string;
  frozenContaminatedLatex: number;
  dryRubber: number;
  unit: string;
  plotCode: string;
  plotName: string;
  plantedYear: number | null;
  areaHa: number;
};

export type PlotProductionFilters = { year?: number; month?: number; unit?: string };
export type TeamPlotProduction = { unit: string; frozenContaminatedLatex: number; dryRubber: number };

const dateOf = (value: Date | string) => new Date(value);

export function aggregatePlotProduction(entries: PlotProductionEntry[], filters: PlotProductionFilters) {
  const grouped = new Map<number, PlotProductionEntry & { frozenContaminatedLatex: number; dryRubber: number }>();
  entries.forEach(entry => {
    const date = dateOf(entry.recordDate);
    if ((filters.year && date.getUTCFullYear() !== filters.year) || (filters.month && date.getUTCMonth() + 1 !== filters.month) || (filters.unit && entry.unit !== filters.unit)) return;
    const current = grouped.get(entry.plotId);
    if (current) { current.frozenContaminatedLatex += entry.frozenContaminatedLatex; current.dryRubber += entry.dryRubber; }
    else grouped.set(entry.plotId, { ...entry });
  });
  return Array.from(grouped.values()).sort((left, right) => compareTeamName(left.unit, right.unit) || comparePlotsByYearAndName({ plantedYear: left.plantedYear, name: left.plotName, code: left.plotCode }, { plantedYear: right.plantedYear, name: right.plotName, code: right.plotCode }));
}

export function aggregatePlotProductionByTeam(rows: ReturnType<typeof aggregatePlotProduction>): TeamPlotProduction[] {
  const grouped = new Map<string, TeamPlotProduction>();
  rows.forEach(row => {
    const current = grouped.get(row.unit) ?? { unit: row.unit, frozenContaminatedLatex: 0, dryRubber: 0 };
    current.frozenContaminatedLatex += row.frozenContaminatedLatex;
    current.dryRubber += row.dryRubber;
    grouped.set(row.unit, current);
  });
  return Array.from(grouped.values()).sort((left, right) => compareTeamName(left.unit, right.unit));
}

export function plotProductionExcelRows(rows: ReturnType<typeof aggregatePlotProduction>) {
  const details = rows.map((row, index) => ({ STT: index + 1, Đội: row.unit, Lô: row.plotName, "Năm trồng": row.plantedYear ?? "", "Diện tích (ha)": row.areaHa, "Mủ đông, tạp (kg)": row.frozenContaminatedLatex, "Quy khô (kg)": row.dryRubber }));
  const totals = rows.reduce((sum, row) => ({ frozen: sum.frozen + row.frozenContaminatedLatex, dry: sum.dry + row.dryRubber }), { frozen: 0, dry: 0 });
  return [...details, { STT: "", Đội: "", Lô: "Tổng khối lượng", "Năm trồng": "", "Diện tích (ha)": "", "Mủ đông, tạp (kg)": totals.frozen, "Quy khô (kg)": totals.dry }];
}
