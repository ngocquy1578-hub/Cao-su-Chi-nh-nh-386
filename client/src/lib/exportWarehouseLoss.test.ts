import { describe, expect, it } from "vitest";
import { calculateProjectedWarehouseLoss } from "./exportWarehouseLoss";

describe("calculateProjectedWarehouseLoss", () => {
  it("tính hao kho sau khi cộng bản xuất đang nhập", () => {
    expect(calculateProjectedWarehouseLoss(1_000, 250, 125)).toEqual({ projectedExport: 375, lossKg: 625, exceedsImportKg: 0 });
  });

  it("không cho hao kho âm và nêu phần xuất vượt nhập", () => {
    expect(calculateProjectedWarehouseLoss(100, 90, 30)).toEqual({ projectedExport: 120, lossKg: 0, exceedsImportKg: 20 });
  });
});
