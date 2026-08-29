import { describe, expect, it } from "vitest";
import { parseWorkerPlotAllocationRows } from "./workerPlotAllocationImport";

describe("parseWorkerPlotAllocationRows", () => {
  it("tách ba nhóm Vườn A/B/C thành các dòng import độc lập", () => {
    const rows = [["STT"], [""], [1, "Đội 2", "YIM RA", "NC-002", "LO-DOI-2-2012-7A", "", "", 1, 12, 2.35, "LO-DOI-2-2012-8", "", "", 13, 25, "3,40"]];
    const result = parseWorkerPlotAllocationRows(rows);
    expect(result.issues).toEqual([]);
    expect(result.parsed).toEqual([{ unit: "Đội 2", workerName: "YIM RA", employeeCode: "NC-002", gardenType: "A", plotCode: "LO-DOI-2-2012-7A", rowStart: 1, rowEnd: 12, areaHa: 2.35 }, { unit: "Đội 2", workerName: "YIM RA", employeeCode: "NC-002", gardenType: "B", plotCode: "LO-DOI-2-2012-8", rowStart: 13, rowEnd: 25, areaHa: 3.4 }]);
  });

  it("giữ nguyên diện tích thập phân khi Excel trả về ô số", () => {
    const rows = [["STT"], [""], [1, "Đội 2", "YIM RA", "", "LO-DOI-2-2012-7A", "", "", 1, 12, 2.35]];
    expect(parseWorkerPlotAllocationRows(rows).parsed[0]?.areaHa).toBe(2.35);
  });
});
