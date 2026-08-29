import { describe, expect, it } from "vitest";
import { groupPlotsByGarden, groupPlotsByTeam } from "./plotTeamGroups";

describe("groupPlotsByTeam", () => {
  it("nhóm trọn Lô theo Đội và cộng diện tích thực tế của từng Đội", () => {
    const groups = groupPlotsByTeam([
      { unit: "Đội 2", name: "Lô 1 (2011)", code: "D2-1", plantedYear: 2011, areaHa: 2.5, gardenType: "B" },
      { unit: "Đội 1", name: "Lô 10 (2012)", code: "D1-10", plantedYear: 2012, areaHa: 1, gardenType: "A" },
      { unit: "Đội 1", name: "Lô 2 (2011)", code: "D1-2", plantedYear: 2011, areaHa: 3.25, gardenType: "A" },
    ]);
    expect(groups.map(group => ({ unit: group.unit, plotCount: group.plotCount, areaHa: group.areaHa, gardenCounts: group.gardenCounts, gardenAreas: group.gardenAreas, codes: group.plots.map(plot => plot.code) }))).toEqual([
      { unit: "Đội 1", plotCount: 2, areaHa: 4.25, gardenCounts: { A: 2, B: 0, C: 0 }, gardenAreas: { A: 4.25, B: 0, C: 0 }, codes: ["D1-2", "D1-10"] },
      { unit: "Đội 2", plotCount: 1, areaHa: 2.5, gardenCounts: { A: 0, B: 1, C: 0 }, gardenAreas: { A: 0, B: 2.5, C: 0 }, codes: ["D2-1"] },
    ]);
  });

  it("nhóm Lô trong một Đội theo thứ tự Vườn A, B, C rồi chưa phân loại", () => {
    const groups = groupPlotsByGarden([
      { unit: "Đội 1", name: "Lô 4 (2011)", code: "D1-4", plantedYear: 2011, areaHa: 1, gardenType: null },
      { unit: "Đội 1", name: "Lô 2 (2011)", code: "D1-2", plantedYear: 2011, areaHa: 2.5, gardenType: "B" },
      { unit: "Đội 1", name: "Lô 1 (2011)", code: "D1-1", plantedYear: 2011, areaHa: 3, gardenType: "A" },
      { unit: "Đội 1", name: "Lô 3 (2011)", code: "D1-3", plantedYear: 2011, areaHa: 1.25, gardenType: "C" },
    ]);
    expect(groups.map(group => ({ gardenType: group.gardenType, areaHa: group.areaHa, codes: group.plots.map(plot => plot.code) }))).toEqual([
      { gardenType: "A", areaHa: 3, codes: ["D1-1"] },
      { gardenType: "B", areaHa: 2.5, codes: ["D1-2"] },
      { gardenType: "C", areaHa: 1.25, codes: ["D1-3"] },
      { gardenType: "unclassified", areaHa: 1, codes: ["D1-4"] },
    ]);
  });
});
