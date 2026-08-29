import { describe, expect, it } from "vitest";
import { buildCareDailyExportRows } from "./careDailyExport";

const record = { activityDate: "2026-08-23T00:00:00.000Z", unit: "Đội 1", gardenName: "Vườn A", areaHa: 2.5, tappingSection: 3, workContent: "Làm cỏ", planQuantity: 10, actualQuantity: 8, cumulativeQuantity: 8, metricUnit: "Ha", progressPercent: 80, pendingGardens: 1, partialGardens: 2, nextGarden: "Vườn B", note: "Đủ vật tư" };

describe("buildCareDailyExportRows", () => {
  it("xuất cột cạo mủ riêng với chỉ tiêu cạo", () => {
    const [row] = buildCareDailyExportRows("tapping", [record]);
    expect(row).toMatchObject({ Vườn: "Vườn A", "Diện tích (ha)": 2.5, "Phần cạo": 3, "Chưa cạo": 1, "Cạo chưa xong": 2, "Cạo tiếp vườn": "Vườn B" });
  });
  it("xuất bảng chăm sóc với nội dung công việc và không thêm chỉ tiêu cạo", () => {
    const [row] = buildCareDailyExportRows("care", [record]);
    expect(row).toMatchObject({ "Nội dung công việc": "Làm cỏ", "% hoàn thành": 80 });
    expect(row).not.toHaveProperty("Vườn");
  });
});
