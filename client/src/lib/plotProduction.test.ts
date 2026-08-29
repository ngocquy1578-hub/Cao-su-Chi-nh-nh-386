import { describe, expect, it } from "vitest";
import { aggregatePlotProduction, aggregatePlotProductionByTeam, plotProductionExcelRows, type PlotProductionEntry } from "./plotProduction";

const entries: PlotProductionEntry[] = [
  { id: 1, plotId: 2, recordDate: "2026-08-01T12:00:00.000Z", frozenContaminatedLatex: 10, dryRubber: 8, unit: "Đội 1", plotCode: "L-02", plotName: "Lô 02", plantedYear: 2011, areaHa: 2.5 },
  { id: 2, plotId: 2, recordDate: "2026-08-20T12:00:00.000Z", frozenContaminatedLatex: 5, dryRubber: 4, unit: "Đội 1", plotCode: "L-02", plotName: "Lô 02", plantedYear: 2011, areaHa: 2.5 },
  { id: 3, plotId: 3, recordDate: "2026-07-20T12:00:00.000Z", frozenContaminatedLatex: 30, dryRubber: 22, unit: "Đội 2", plotCode: "L-03", plotName: "Lô 03", plantedYear: 2012, areaHa: 3 },
];

describe("plot production summary", () => {
  it("tổng hợp đúng theo năm, tháng và Đội", () => {
    expect(aggregatePlotProduction(entries, { year: 2026, month: 8, unit: "Đội 1" })).toMatchObject([{ plotId: 2, frozenContaminatedLatex: 15, dryRubber: 12 }]);
  });

  it("tạo đúng dòng STT và tổng khối lượng cho Excel", () => {
    expect(plotProductionExcelRows(aggregatePlotProduction(entries, { year: 2026, month: 8 }))).toEqual([
      { STT: 1, Đội: "Đội 1", Lô: "Lô 02", "Năm trồng": 2011, "Diện tích (ha)": 2.5, "Mủ đông, tạp (kg)": 15, "Quy khô (kg)": 12 },
      { STT: "", Đội: "", Lô: "Tổng khối lượng", "Năm trồng": "", "Diện tích (ha)": "", "Mủ đông, tạp (kg)": 15, "Quy khô (kg)": 12 },
    ]);
  });

  it("so sánh được Mủ đông/tạp và Quy khô theo từng Đội", () => {
    expect(aggregatePlotProductionByTeam(aggregatePlotProduction(entries, { year: 2026 }))).toEqual([
      { unit: "Đội 1", frozenContaminatedLatex: 15, dryRubber: 12 },
      { unit: "Đội 2", frozenContaminatedLatex: 30, dryRubber: 22 },
    ]);
  });
});
