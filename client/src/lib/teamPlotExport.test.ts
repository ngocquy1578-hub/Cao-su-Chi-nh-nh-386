import { describe, expect, it } from "vitest";
import { buildTeamPlotExportRows, summarizeTeamGardenAreas } from "./teamPlotExport";

describe("buildTeamPlotExportRows", () => {
  it("xuất đúng các cột danh mục Lô của một Đội", () => {
    expect(buildTeamPlotExportRows([{ name: "Lô 1 (2011)", plantedYear: 2011, gardenType: "A", areaHa: "18.9", tappingDay: 3, rowStart: 1, rowEnd: 20, tappingTrees: 460, note: null }])).toEqual([{
      STT: 1, Lô: "Lô 1 (2011)", "Năm trồng": 2011, Vườn: "Vườn A", "Diện tích (ha)": 18.9, "Ngày cạo": 3, "Từ hàng": 1, "Đến hàng": 20, "Số cây cạo": 460, "Ghi chú": "",
    }]);
  });

  it("tổng diện tích chi tiết từng Vườn cho Excel theo Đội", () => {
    expect(summarizeTeamGardenAreas([
      { name: "Lô A", plantedYear: 2011, gardenType: "A", areaHa: 1.25, tappingDay: null, rowStart: null, rowEnd: null, tappingTrees: null, note: null },
      { name: "Lô B", plantedYear: 2012, gardenType: "B", areaHa: "2.5", tappingDay: null, rowStart: null, rowEnd: null, tappingTrees: null, note: null },
      { name: "Lô chưa phân loại", plantedYear: null, gardenType: null, areaHa: 0.75, tappingDay: null, rowStart: null, rowEnd: null, tappingTrees: null, note: null },
    ])).toEqual([
      { garden: "Vườn A", plotCount: 1, areaHa: 1.25 }, { garden: "Vườn B", plotCount: 1, areaHa: 2.5 }, { garden: "Vườn C", plotCount: 0, areaHa: 0 }, { garden: "Chưa phân loại", plotCount: 1, areaHa: 0.75 }, { garden: "Tổng cộng", plotCount: 3, areaHa: 4.5 },
    ]);
  });
});
