import { describe, expect, it } from "vitest";
import { buildCareWorkbookSheets } from "./careWorkbook";

describe("buildCareWorkbookSheets", () => {
  it("bỏ hẳn sheet của các nhóm chưa có dữ liệu", () => {
    const sheets = buildCareWorkbookSheets([{ category: "tapping", unit: "Đội 1" }, { category: "tapping", unit: "Đội 2" }]);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.name).toBe("Theo dõi cạo mủ");
    expect(sheets[0]?.rows).toHaveLength(2);
  });
});
