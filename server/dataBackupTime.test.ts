import { describe, expect, it } from "vitest";
import { getVietnamBackupDateKey, isVietnamSunday } from "./dataBackupTime";

describe("lịch sao lưu theo giờ Việt Nam", () => {
  it("nhận diện đúng 00:15 Chủ nhật tại Việt Nam từ UTC", () => {
    const sundayAt0015 = new Date("2026-08-22T17:15:00.000Z");
    expect(getVietnamBackupDateKey(sundayAt0015)).toBe("2026-08-23");
    expect(isVietnamSunday(sundayAt0015)).toBe(true);
  });

  it("không nhận diện thứ bảy Việt Nam là ngày sao lưu", () => {
    expect(isVietnamSunday(new Date("2026-08-22T10:00:00.000Z"))).toBe(false);
  });
});
