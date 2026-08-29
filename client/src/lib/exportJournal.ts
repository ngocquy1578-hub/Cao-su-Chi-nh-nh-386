export type TeamExportJournalRow = {
  id: number;
  unit: string;
  periodLabel: string;
  recordDate: Date | string;
  frozenContaminatedLatex: number;
  latexThread: number;
  totalExport: number;
  preparedBy?: string | null;
  note?: string | null;
};

function toDateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function filterTeamExportJournal(rows: TeamExportJournalRow[], filters: { unit?: string; periodLabel?: string; fromDate?: string; toDate?: string }) {
  return rows.filter(row => {
    const key = toDateKey(row.recordDate);
    return (!filters.unit || row.unit === filters.unit)
      && (!filters.periodLabel || row.periodLabel === filters.periodLabel)
      && (!filters.fromDate || key >= filters.fromDate)
      && (!filters.toDate || key <= filters.toDate);
  });
}

export function toTeamExportExcelRows(rows: TeamExportJournalRow[]) {
  const details = rows.map(row => ({
    "Ngày xuất": toDateKey(row.recordDate),
    "Đội": row.unit,
    "Đợt": row.periodLabel,
    "Mủ đông tạp (kg)": row.frozenContaminatedLatex,
    "Mủ dây (kg)": row.latexThread,
    "Cộng xuất (kg)": row.totalExport,
    "Người lập": row.preparedBy ?? "",
    "Ghi chú": row.note ?? "",
  }));
  const totals = rows.reduce((sum, row) => ({ frozen: sum.frozen + row.frozenContaminatedLatex, thread: sum.thread + row.latexThread, total: sum.total + row.totalExport }), { frozen: 0, thread: 0, total: 0 });
  return [...details, { "Ngày xuất": "Tổng khối lượng", "Đội": "", "Đợt": "", "Mủ đông tạp (kg)": totals.frozen, "Mủ dây (kg)": totals.thread, "Cộng xuất (kg)": totals.total, "Người lập": "", "Ghi chú": "" }];
}
