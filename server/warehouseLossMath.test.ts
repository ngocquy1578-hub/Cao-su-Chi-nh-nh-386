import { describe, expect, it } from "vitest";
import { aggregateWarehouseLoss } from "./warehouseLossMath";

describe("aggregateWarehouseLoss", () => {
  it("tổng hợp cộng nhập, cộng xuất và hao hụt chính xác theo đội, kỳ", () => {
    const report = aggregateWarehouseLoss([{ unit: "Đội 1", periodLabel: "Đợt 1", totalImport: 100 }, { unit: "Đội 1", periodLabel: "Đợt 1", totalImport: 50 }, { unit: "Đội 2", periodLabel: "Đợt 1", totalImport: 80 }], [{ unit: "Đội 1", periodLabel: "Đợt 1", totalExport: 120 }, { unit: "Đội 2", periodLabel: "Đợt 1", totalExport: 60 }], "Đợt 1");
    expect(report.rows).toEqual(expect.arrayContaining([expect.objectContaining({ unit: "Đội 1", totalImport: 150, totalExport: 120, lossKg: 30, lossPercent: 20 }), expect.objectContaining({ unit: "Đội 2", totalImport: 80, totalExport: 60, lossKg: 20, lossPercent: 25 })]));
    expect(report.totals).toMatchObject({ totalImport: 230, totalExport: 180, lossKg: 50 });
    expect(report.totals.lossPercent).toBeCloseTo((50 / 230) * 100);
  });

  it("lọc theo tháng, chỉ trả kỳ có dữ liệu và sắp kỳ mới đến cũ", () => {
    const report = aggregateWarehouseLoss([{ unit: "Đội 1", periodLabel: "Đợt 1-7", totalImport: 10, recordDate: new Date("2026-07-10T00:00:00Z") }, { unit: "Đội 1", periodLabel: "Đợt 3-8", totalImport: 20, recordDate: new Date("2026-08-10T00:00:00Z") }, { unit: "Đội 2", periodLabel: "Đợt 1-8", totalImport: 30, recordDate: new Date("2026-08-10T00:00:00Z") }], [], undefined, "8/2026");
    expect(report.periods).toEqual(["Đợt 3-8", "Đợt 1-8"]);
    expect(report.rows.map(row => row.periodLabel)).toEqual(["Đợt 3-8", "Đợt 1-8"]);
    expect(report.months).toEqual(["8/2026", "7/2026"]);
  });
});
