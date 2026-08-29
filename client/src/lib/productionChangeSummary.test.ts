import { describe, expect, it } from "vitest";
import { summarizeProductionChangeRows } from "./productionChangeSummary";

describe("summarizeProductionChangeRows", () => {
  it("tổng nhập theo vườn nhưng chỉ tính cộng xuất một lần cho mỗi Đội/kỳ", () => {
    const rows = summarizeProductionChangeRows([
      { unit: "Đội 2", periodLabel: "Đợt 1-8", totalImport: 20, totalExport: 30 },
      { unit: "Đội 1", periodLabel: "Đợt 1-8", totalImport: 10, totalExport: 40 },
      { unit: "Đội 1", periodLabel: "Đợt 1-8", totalImport: 15, totalExport: 40 },
    ]);
    expect(rows[0]).toEqual({ label: "Tổng chung", totalImport: 45, totalExport: 70, differenceKg: -25 });
    expect(rows[1]).toEqual({ label: "Đội 1", totalImport: 25, totalExport: 40, differenceKg: -15 });
  });
});
