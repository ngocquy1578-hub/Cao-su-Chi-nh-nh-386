import { describe, expect, it } from "vitest";
import { calculateLatexTotals } from "./rubberMath";

describe("calculateLatexTotals", () => {
  it("tính hao kho chính xác theo công thức (cộng nhập − cộng xuất) / cộng nhập × 100%", () => {
    const result = calculateLatexTotals(1_250, 1_175);
    expect(result.totalImport).toBe(1_250);
    expect(result.totalExport).toBe(1_175);
    expect(result.lossRate).toBe(6);
  });

  it("trả về 0% hao kho khi cộng nhập bằng 0 để tránh phép chia không xác định", () => {
    expect(calculateLatexTotals(0, 0).lossRate).toBe(0);
  });
});
