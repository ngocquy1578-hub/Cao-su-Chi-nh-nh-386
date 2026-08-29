import { describe, expect, it } from "vitest";
import { getVietnamMonthKey, isFirstDayOfVietnamMonth } from "./workforceSnapshotTime";

describe("workforceSnapshotTime", () => {
  it("xác định tháng và ngày đầu tháng theo giờ Việt Nam", () => {
    const midnightVietnam = new Date("2026-08-31T17:05:00.000Z");
    expect(getVietnamMonthKey(midnightVietnam)).toBe("2026-09");
    expect(isFirstDayOfVietnamMonth(midnightVietnam)).toBe(true);
  });
});
