export type PlotAreaByYearInput = { plantedYear: number | null; areaHa: number | string | null };

export type PlotAreaByYear = { plantedYear: number | null; plotCount: number; areaHa: number };

export function summarizePlotAreaByYear(plots: PlotAreaByYearInput[]): PlotAreaByYear[] {
  const summaries = new Map<number | null, PlotAreaByYear>();
  plots.forEach(plot => {
    const current = summaries.get(plot.plantedYear) ?? { plantedYear: plot.plantedYear, plotCount: 0, areaHa: 0 };
    current.plotCount += 1;
    current.areaHa += Number(plot.areaHa ?? 0);
    summaries.set(plot.plantedYear, current);
  });
  return Array.from(summaries.values()).sort((left, right) => {
    if (left.plantedYear === null) return 1;
    if (right.plantedYear === null) return -1;
    return left.plantedYear - right.plantedYear;
  });
}
