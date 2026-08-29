export type TeamPlotExportInput = { name: string; plantedYear: number | null; gardenType: "A" | "B" | "C" | null; areaHa: number | string | null; tappingDay: number | null; rowStart: number | null; rowEnd: number | null; tappingTrees: number | null; note: string | null };

export type TeamGardenAreaSummary = { garden: "Vườn A" | "Vườn B" | "Vườn C" | "Chưa phân loại" | "Tổng cộng"; plotCount: number; areaHa: number };

export function summarizeTeamGardenAreas(plots: TeamPlotExportInput[]): TeamGardenAreaSummary[] {
  const summaries: TeamGardenAreaSummary[] = [
    { garden: "Vườn A", plotCount: 0, areaHa: 0 },
    { garden: "Vườn B", plotCount: 0, areaHa: 0 },
    { garden: "Vườn C", plotCount: 0, areaHa: 0 },
    { garden: "Chưa phân loại", plotCount: 0, areaHa: 0 },
  ];
  plots.forEach(plot => {
    const target = summaries[plot.gardenType === "A" ? 0 : plot.gardenType === "B" ? 1 : plot.gardenType === "C" ? 2 : 3];
    target.plotCount += 1;
    target.areaHa += Number(plot.areaHa ?? 0);
  });
  const total = summaries.reduce((sum, item) => ({ garden: "Tổng cộng" as const, plotCount: sum.plotCount + item.plotCount, areaHa: sum.areaHa + item.areaHa }), { garden: "Tổng cộng" as const, plotCount: 0, areaHa: 0 });
  return [...summaries, total];
}

export function buildTeamPlotExportRows(plots: TeamPlotExportInput[]) {
  return plots.map((plot, index) => ({
    STT: index + 1,
    Lô: plot.name,
    "Năm trồng": plot.plantedYear ?? "",
    Vườn: plot.gardenType ? `Vườn ${plot.gardenType}` : "Chưa phân loại",
    "Diện tích (ha)": Number(plot.areaHa ?? 0),
    "Ngày cạo": plot.tappingDay ?? "",
    "Từ hàng": plot.rowStart ?? "",
    "Đến hàng": plot.rowEnd ?? "",
    "Số cây cạo": plot.tappingTrees ?? "",
    "Ghi chú": plot.note ?? "",
  }));
}
