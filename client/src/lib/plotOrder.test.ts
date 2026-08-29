import { describe, expect, it } from "vitest";
import { comparePlotsByTeamYearAndName, comparePlotsByYearAndName } from "./plotOrder";

describe("comparePlotsByYearAndName", () => {
  it("sắp năm trồng tăng dần rồi đến số lô", () => {
    const rows = [
      { code: "C", name: "Lô 10 (2011)", plantedYear: 2011 },
      { code: "A", name: "Lô 2 (2011)", plantedYear: 2011 },
      { code: "B", name: "Lô 1 (2012)", plantedYear: 2012 },
    ];
    expect(rows.sort(comparePlotsByYearAndName).map(row => row.code)).toEqual(["A", "C", "B"]);
  });

  it("xếp toàn bộ Lô số đơn trước các Lô có hậu tố trong cùng năm trồng", () => {
    const rows = [
      { code: "L3-2012", name: "Lô 3-2012 (2011)", plantedYear: 2011 },
      { code: "L20", name: "Lô 20 (2011)", plantedYear: 2011 },
      { code: "L4", name: "Lô 4 (2011)", plantedYear: 2011 },
      { code: "L1", name: "Lô 1 (2011)", plantedYear: 2011 },
      { code: "L4-2012", name: "Lô 4-2012 (2011)", plantedYear: 2011 },
      { code: "L1-2012", name: "Lô 1 (2012)", plantedYear: 2012 },
    ];
    expect(rows.sort(comparePlotsByYearAndName).map(row => row.code)).toEqual(["L1", "L4", "L20", "L3-2012", "L4-2012", "L1-2012"]);
  });

  it("hiển thị hết Lô của Đội 1 trước khi chuyển sang Đội 2", () => {
    const rows = [
      { code: "D2-L1", name: "Lô 1 (2011)", plantedYear: 2011, unit: "Đội 2" },
      { code: "D1-L10", name: "Lô 10 (2012)", plantedYear: 2012, unit: "Đội 1" },
      { code: "D1-L2", name: "Lô 2 (2011)", plantedYear: 2011, unit: "Đội 1" },
      { code: "D2-L2", name: "Lô 2 (2011)", plantedYear: 2011, unit: "Đội 2" },
    ];
    expect(rows.sort(comparePlotsByTeamYearAndName).map(row => row.code)).toEqual(["D1-L2", "D1-L10", "D2-L1", "D2-L2"]);
  });
});
