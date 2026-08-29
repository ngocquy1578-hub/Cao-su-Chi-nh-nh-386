import { describe, expect, it } from "vitest";
import { DEFAULT_PERIOD, formatAreaHa, periodOptions, STANDARD_PERIODS } from "./rubber";

describe("danh mục đợt chuẩn", () => {
  it("đặt Đợt 1 làm mặc định và luôn giữ Đợt 1/2/3 trước các đợt lịch sử", () => {
    expect(DEFAULT_PERIOD).toBe("Đợt 1");
    expect(STANDARD_PERIODS).toEqual(["Đợt 1", "Đợt 2", "Đợt 3"]);
    expect(periodOptions(["Đợt 2", "Đợt 1-7"])).toEqual(["Đợt 1", "Đợt 2", "Đợt 3", "Đợt 1-7"]);
  });
});

describe("định dạng diện tích vườn", () => {
  it("luôn hiển thị diện tích đến 02 chữ số thập phân", () => {
    expect(formatAreaHa(1582.711)).toBe("1.582,71");
    expect(formatAreaHa(283.13)).toBe("283,13");
    expect(formatAreaHa(123.21)).toBe("123,21");
  });
});
