import { describe, expect, it } from "vitest";
import { buildWorkforceMonthHistory } from "./workforceHistory";

describe("buildWorkforceMonthHistory", () => {
  it("gắn nhãn tháng và tính biến động theo snapshot liền trước", () => {
    expect(buildWorkforceMonthHistory([
      { month: "2026-07", activeCount: 330, totalCount: 334 },
      { month: "2026-08", activeCount: 335, totalCount: 335 },
    ])).toEqual([
      { month: "2026-07", activeCount: 330, totalCount: 334, label: "Tháng 7/2026", activeChange: null, totalChange: null },
      { month: "2026-08", activeCount: 335, totalCount: 335, label: "Tháng 8/2026", activeChange: 5, totalChange: 1 },
    ]);
  });
});
