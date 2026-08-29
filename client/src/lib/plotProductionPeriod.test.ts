import { describe, expect, it } from "vitest";
import { monthStartDate, monthYearLabel } from "./plotProductionPeriod";

describe("kỳ sản lượng theo lô", () => {
  it("chuẩn hóa tháng và năm về ngày đầu tháng UTC", () => {
    expect(monthStartDate(2026, 8).toISOString()).toBe("2026-08-01T12:00:00.000Z");
    expect(monthYearLabel("2026-08-20T12:00:00.000Z")).toBe("Tháng 8/2026");
  });

  it("không nhận tháng hoặc năm ngoài phạm vi", () => {
    expect(() => monthStartDate(2026, 13)).toThrow("Tháng không hợp lệ");
    expect(() => monthStartDate(1899, 1)).toThrow("Năm không hợp lệ");
  });
});
