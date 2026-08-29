import { compareTeamName } from "@shared/teamOrder";

export type GardenAreaChartPlot = { unit: string; gardenType: "A" | "B" | "C" | null; areaHa: number | string | null };

export type GardenAreaChartRow = { unit: string; gardenA: number; gardenB: number; gardenC: number };

export function buildGardenAreaChartData(plots: GardenAreaChartPlot[]): GardenAreaChartRow[] {
  const rows = new Map<string, GardenAreaChartRow>();
  plots.forEach(plot => {
    const row = rows.get(plot.unit) ?? { unit: plot.unit, gardenA: 0, gardenB: 0, gardenC: 0 };
    const areaHa = Number(plot.areaHa ?? 0);
    if (plot.gardenType === "A") row.gardenA += areaHa;
    if (plot.gardenType === "B") row.gardenB += areaHa;
    if (plot.gardenType === "C") row.gardenC += areaHa;
    rows.set(plot.unit, row);
  });
  return Array.from(rows.values()).sort((left, right) => compareTeamName(left.unit, right.unit));
}
