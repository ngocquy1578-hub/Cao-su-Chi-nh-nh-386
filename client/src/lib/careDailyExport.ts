export type CareCategory = "tapping" | "reinforcement" | "care" | "treatment";
export type CareDailyExportRecord = { activityDate: Date | string; unit: string; gardenName?: string | null; areaHa?: number | null; tappingSection?: number | null; workContent?: string | null; planQuantity: number; actualQuantity: number; cumulativeQuantity: number; metricUnit: string; progressPercent?: number | null; pendingGardens?: number | null; partialGardens?: number | null; nextGarden?: string | null; note?: string | null };

export const careDailyExportMeta: Record<CareCategory, { fileName: string; sheetName: string }> = {
  tapping: { fileName: "theo-doi-cao-mu.xlsx", sheetName: "Theo dõi cạo mủ" },
  reinforcement: { fileName: "gia-co-keo-mang-tam-che.xlsx", sheetName: "Gia cố" },
  care: { fileName: "cham-soc-vuon-cay.xlsx", sheetName: "Chăm sóc" },
  treatment: { fileName: "phun-boi-thuoc.xlsx", sheetName: "Phun bôi thuốc" },
};

export function buildCareDailyExportRows(category: CareCategory, records: CareDailyExportRecord[]) {
  return records.map(row => {
    const base = { Ngày: new Date(row.activityDate).toISOString().slice(0, 10), Đội: row.unit, KH: row.planQuantity, TH: row.actualQuantity, "Lũy kế": row.cumulativeQuantity, "Đơn vị tính": row.metricUnit, "% hoàn thành": Number(Number(row.progressPercent ?? 0).toFixed(2)), "Ghi chú": row.note ?? "" };
    if (category === "tapping") return { ...base, Vườn: row.gardenName ?? "", "Diện tích (ha)": row.areaHa ?? "", "Phần cạo": row.tappingSection ?? "", "Chưa cạo": row.pendingGardens ?? "", "Cạo chưa xong": row.partialGardens ?? "", "Cạo tiếp vườn": row.nextGarden ?? "" };
    if (category === "care" || category === "treatment") return { ...base, "Nội dung công việc": row.workContent ?? "" };
    return base;
  });
}
