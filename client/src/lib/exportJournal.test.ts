import { describe, expect, it } from "vitest";
import { filterTeamExportJournal, toTeamExportExcelRows, type TeamExportJournalRow } from "./exportJournal";

const rows: TeamExportJournalRow[] = [
  { id: 1, unit: "Đội 1", periodLabel: "Đợt 1", recordDate: "2026-08-01T00:00:00.000Z", frozenContaminatedLatex: 10, latexThread: 2, totalExport: 12 },
  { id: 2, unit: "Đội 1", periodLabel: "Đợt 2", recordDate: "2026-08-10T00:00:00.000Z", frozenContaminatedLatex: 20, latexThread: 1, totalExport: 21 },
  { id: 3, unit: "Đội 2", periodLabel: "Đợt 2", recordDate: "2026-08-10T00:00:00.000Z", frozenContaminatedLatex: 30, latexThread: 0, totalExport: 30 },
];

describe("export journal filters", () => {
  it("lọc đúng Đội, Đợt và khoảng ngày bao gồm hai đầu mốc", () => {
    expect(filterTeamExportJournal(rows, { unit: "Đội 1", periodLabel: "Đợt 2", fromDate: "2026-08-01", toDate: "2026-08-10" }).map(row => row.id)).toEqual([2]);
  });

  it("tạo chi tiết, người lập, ghi chú và dòng tổng khối lượng cho Excel", () => {
    expect(toTeamExportExcelRows([{ ...rows[0], preparedBy: "Nguyễn Văn A", note: "Đã đối chiếu" }])).toEqual([
      { "Ngày xuất": "2026-08-01", "Đội": "Đội 1", "Đợt": "Đợt 1", "Mủ đông tạp (kg)": 10, "Mủ dây (kg)": 2, "Cộng xuất (kg)": 12, "Người lập": "Nguyễn Văn A", "Ghi chú": "Đã đối chiếu" },
      { "Ngày xuất": "Tổng khối lượng", "Đội": "", "Đợt": "", "Mủ đông tạp (kg)": 10, "Mủ dây (kg)": 2, "Cộng xuất (kg)": 12, "Người lập": "", "Ghi chú": "" },
    ]);
  });
});
