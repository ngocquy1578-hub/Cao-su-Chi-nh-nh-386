import { describe, expect, it } from "vitest";
import { summarizePlotAreaByYear } from "./plotAreaByYear";

describe("summarizePlotAreaByYear", () => {
  it("cộng diện tích và số Lô theo năm trồng, để năm chưa khai báo ở cuối", () => {
    expect(summarizePlotAreaByYear([
      { plantedYear: 2012, areaHa: 1.25 },
      { plantedYear: 2011, areaHa: "2.5" },
      { plantedYear: 2011, areaHa: 0.75 },
      { plantedYear: null, areaHa: 0.5 },
    ])).toEqual([
      { plantedYear: 2011, plotCount: 2, areaHa: 3.25 },
      { plantedYear: 2012, plotCount: 1, areaHa: 1.25 },
      { plantedYear: null, plotCount: 1, areaHa: 0.5 },
    ]);
  });
});
