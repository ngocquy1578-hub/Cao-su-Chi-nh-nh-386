import { describe, expect, it } from "vitest";
import { buildPlotAllocationHistoryExportRows } from "./plotAllocationHistoryExport";

describe("buildPlotAllocationHistoryExportRows", () => {
  it("đưa đầy đủ chi tiết phân bổ lô vào hàng Excel", () => {
    const [row] = buildPlotAllocationHistoryExportRows([{ createdAt: "2026-08-22T00:05:00.000Z", displayName: "Quản trị viên", username: "admin", summary: "Phân bổ 2 lô Đội 2 vào Vườn A", metadata: { unit: "Đội 2", gardenType: "A", count: 2, rowStart: 1, rowEnd: 20, areaHa: 3.25, tappingTrees: 650 } }]);
    expect(row).toMatchObject({ "Thời điểm (UTC)": "2026-08-22 00:05:00", Đội: "Đội 2", "Vườn phân bổ": "Vườn A", "Số lô": 2, "Từ hàng": 1, "Đến hàng": 20, "Diện tích (ha)": 3.25, "Số cây cạo": 650 });
  });
});
