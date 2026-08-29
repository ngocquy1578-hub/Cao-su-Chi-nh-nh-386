import { describe, expect, it } from "vitest";
import { filterGardenOptions } from "./gardenSearch";

describe("filterGardenOptions", () => {
  const options = [
    { name: "Lô Mười", plantedYear: 2011 },
    { name: "Lô 12", plantedYear: 2012 },
  ];

  it("tìm tên Lô không phân biệt dấu tiếng Việt", () => {
    expect(filterGardenOptions(options, "lo muoi")).toEqual([options[0]]);
  });

  it("tìm Lô theo năm trồng và giữ toàn bộ danh mục khi không có từ khóa", () => {
    expect(filterGardenOptions(options, "2012")).toEqual([options[1]]);
    expect(filterGardenOptions(options, "  ")).toEqual(options);
  });
});
