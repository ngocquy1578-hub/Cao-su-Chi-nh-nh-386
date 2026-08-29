import { describe, expect, it } from "vitest";
import { buildGardenAreaChartData } from "./gardenAreaChart";

describe("buildGardenAreaChartData", () => {
  it("cộng diện tích A/B/C theo Đội và giữ thứ tự Đội", () => {
    expect(buildGardenAreaChartData([
      { unit: "Đội 2", gardenType: "B", areaHa: 2.5 },
      { unit: "Đội 1", gardenType: "A", areaHa: "3.25" },
      { unit: "Đội 1", gardenType: "A", areaHa: 1 },
      { unit: "Đội 1", gardenType: "C", areaHa: 0.75 },
      { unit: "Đội 2", gardenType: null, areaHa: 9 },
    ])).toEqual([
      { unit: "Đội 1", gardenA: 4.25, gardenB: 0, gardenC: 0.75 },
      { unit: "Đội 2", gardenA: 0, gardenB: 2.5, gardenC: 0 },
    ]);
  });
});
