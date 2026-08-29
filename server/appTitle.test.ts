import { describe, expect, it } from "vitest";

describe("application title configuration", () => {
  it("cấu hình tên Cao su CN386 cho phiên bản ứng dụng", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Cao su CN386");
  });
});
