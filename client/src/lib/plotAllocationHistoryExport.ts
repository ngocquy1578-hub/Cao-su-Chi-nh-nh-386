export type PlotAllocationHistoryExportEntry = {
  createdAt: Date | string;
  displayName?: string | null;
  username?: string | null;
  summary: string;
  metadata?: unknown;
};

type AllocationMetadata = { unit?: string; gardenType?: string; count?: number; rowStart?: number; rowEnd?: number; areaHa?: number; tappingTrees?: number };

export function buildPlotAllocationHistoryExportRows(entries: PlotAllocationHistoryExportEntry[]) {
  return entries.map(entry => {
    const metadata = (entry.metadata ?? {}) as AllocationMetadata;
    return {
      "Thời điểm (UTC)": new Date(entry.createdAt).toISOString().replace("T", " ").slice(0, 19),
      "Đội": metadata.unit ?? "",
      "Người thao tác": entry.displayName ?? "",
      "Tên đăng nhập": entry.username ?? "",
      "Vườn phân bổ": metadata.gardenType ? `Vườn ${metadata.gardenType}` : "",
      "Số lô": metadata.count ?? 0,
      "Từ hàng": metadata.rowStart ?? "",
      "Đến hàng": metadata.rowEnd ?? "",
      "Diện tích (ha)": metadata.areaHa ?? "",
      "Số cây cạo": metadata.tappingTrees ?? "",
      "Nội dung": entry.summary,
    };
  });
}
