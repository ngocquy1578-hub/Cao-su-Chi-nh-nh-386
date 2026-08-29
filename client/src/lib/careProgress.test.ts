import { describe, expect, it } from "vitest";
import { calculateCareCompletionPercent } from "./careProgress";

describe("calculateCareCompletionPercent", () => {
  it("tính phần trăm hoàn thành theo kế hoạch và thực hiện", () => {
    expect(calculateCareCompletionPercent("80", "60")).toBe(75);
    expect(calculateCareCompletionPercent("0", "60")).toBe(0);
  });
});
