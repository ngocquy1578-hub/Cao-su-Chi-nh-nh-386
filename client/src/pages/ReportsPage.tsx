import { EmptyState, PageHeader, Panel } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentPeriod, downloadFile, formatDate, formatPercent, formatQuantity, periodOptions } from "@/lib/rubber";
import { trpc } from "@/lib/trpc";
import { compareTeamName } from "@shared/teamOrder";
import { FileSpreadsheet, FileText, Loader2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type DailyImport = { recordDate: Date; frozenLatex: number; latexThread: number; totalImport: number };
type ReportRow = { code: string; name: string; unit: string; frozenLatex: number; latexThreadImport: number; totalImport: number; frozenContaminatedLatex: number; latexThreadExport: number; totalExport: number; lossRate: number; dailyImports: DailyImport[] };
const dayKey = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
const dayLabel = (value: string) => formatDate(new Date(`${value}T12:00:00`));
const safeFile = (value: string) => value.toLocaleLowerCase("vi-VN").replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/(^-|-$)/g, "") || "bao-cao";

export default function ReportsPage() {
  const { data: periods } = trpc.rubber.periods.useQuery();
  const { data: plots = [] } = trpc.rubber.plots.list.useQuery();
  const [periodLabel, setPeriodLabel] = useState<string>(currentPeriod());
  const [unitFilter, setUnitFilter] = useState("");
  const { data: report, isLoading, error } = trpc.rubber.reports.progress.useQuery({ periodLabel });
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const reportRows = useMemo(() => [...((report ?? []) as ReportRow[])].sort((left, right) => compareTeamName(left.unit, right.unit) || left.code.localeCompare(right.code, "vi", { numeric: true })), [report]);
  const unitOptions = useMemo(() => Array.from(new Set([...reportRows.map(row => row.unit), ...plots.map(plot => plot.unit)])).sort(compareTeamName), [reportRows, plots]);
  const rows = useMemo(() => unitFilter ? reportRows.filter(row => row.unit === unitFilter) : reportRows, [reportRows, unitFilter]);
  const dateColumns = useMemo(() => Array.from(new Set(rows.flatMap(row => row.dailyImports.map(item => dayKey(item.recordDate))))).sort(), [rows]);
  const amountOnDate = (row: ReportRow, date: string) => row.dailyImports.filter(item => dayKey(item.recordDate) === date).reduce((sum, item) => sum + item.frozenLatex, 0);
  const totals = useMemo(() => rows.reduce((total, row) => ({ frozenLatex: total.frozenLatex + row.frozenLatex, latexThreadImport: total.latexThreadImport + row.latexThreadImport, totalImport: total.totalImport + row.totalImport, frozenContaminatedLatex: total.frozenContaminatedLatex + row.frozenContaminatedLatex, latexThreadExport: total.latexThreadExport + row.latexThreadExport, totalExport: total.totalExport + row.totalExport }), { frozenLatex: 0, latexThreadImport: 0, totalImport: 0, frozenContaminatedLatex: 0, latexThreadExport: 0, totalExport: 0 }), [rows]);
  const totalLossRate = totals.totalImport > 0 ? ((totals.totalImport - totals.totalExport) / totals.totalImport) * 100 : 0;
  const exportRows = useMemo(() => rows.map((row, index) => ({ STT: index + 1, "Đơn vị": row.unit, "Vườn": row.name, ...Object.fromEntries(dateColumns.map(date => [`Nhập ${dayLabel(date)}`, amountOnDate(row, date)])), "Cộng mủ đông": row.frozenLatex, "Mủ dây nhập": row.latexThreadImport, "Cộng nhập": row.totalImport, "Mủ đông tạp": row.frozenContaminatedLatex, "Mủ dây xuất": row.latexThreadExport, "Cộng xuất": row.totalExport, "Hao kho (%)": Number(row.lossRate.toFixed(2)) })), [rows, dateColumns]);
  const exportTotalRow = useMemo(() => ({ STT: "CỘNG", "Đơn vị": "", "Vườn": "", ...Object.fromEntries(dateColumns.map(date => [`Nhập ${dayLabel(date)}`, rows.reduce((sum, row) => sum + amountOnDate(row, date), 0)])), "Cộng mủ đông": totals.frozenLatex, "Mủ dây nhập": totals.latexThreadImport, "Cộng nhập": totals.totalImport, "Mủ đông tạp": totals.frozenContaminatedLatex, "Mủ dây xuất": totals.latexThreadExport, "Cộng xuất": totals.totalExport, "Hao kho (%)": Number(totalLossRate.toFixed(2)) }), [dateColumns, rows, totals, totalLossRate]);

  const exportCsv = () => {
    setExporting("csv");
    const headers = Object.keys(exportRows[0] ?? exportTotalRow);
    const asCsvLine = (row: Record<string, string | number>) => headers.map(header => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(",");
    const content = [headers.join(","), ...exportRows.map(asCsvLine), asCsvLine(exportTotalRow)].join("\n");
    downloadFile(`bao-cao-tien-do-${safeFile(periodLabel)}${unitFilter ? `-${safeFile(unitFilter)}` : ""}.csv`, `\ufeff${content}`, "text/csv;charset=utf-8");
    setExporting(null);
    toast.success("Đã xuất CSV");
  };

  const exportExcel = async () => {
    try {
      setExporting("xlsx");
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.aoa_to_sheet([["BÁO CÁO TIẾN ĐỘ NHẬP XUẤT MỦ"], [periodLabel], [unitFilter || "Tất cả Đội"], ["Đơn vị tính: Kg"], []]);
      XLSX.utils.sheet_add_json(sheet, exportRows, { origin: "A6" });
      XLSX.utils.sheet_add_json(sheet, [exportTotalRow], { origin: -1, skipHeader: true });
      const lastColumn = Object.keys(exportTotalRow).length - 1;
      sheet["!merges"] = [0, 1, 2, 3].map(row => ({ s: { r: row, c: 0 }, e: { r: row, c: lastColumn } }));
      sheet["!cols"] = [6, 16, 20, ...dateColumns.map(() => 14), 18, 18, 16, 18, 17, 16, 15].map(wch => ({ wch }));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Tiến độ mủ");
      XLSX.writeFile(book, `bao-cao-tien-do-${safeFile(periodLabel)}${unitFilter ? `-${safeFile(unitFilter)}` : ""}.xlsx`);
      toast.success("Đã xuất Excel");
    } catch {
      toast.error("Không thể xuất Excel. Vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  };

  return <div className="page-enter">
    <PageHeader eyebrow="Tổng hợp theo kỳ" title="Báo cáo tiến độ nhập xuất mủ" description="Đối chiếu nhập mủ theo ngày, cộng nhập, cộng xuất và hao kho theo từng đơn vị/vườn." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv} disabled={!rows.length || exporting !== null} className="bg-white"><FileText className="mr-2 h-4 w-4" />{exporting === "csv" ? "Đang xuất…" : "CSV"}</Button><Button onClick={exportExcel} disabled={!rows.length || exporting !== null} className="bg-emerald-700 hover:bg-emerald-800"><FileSpreadsheet className="mr-2 h-4 w-4" />{exporting === "xlsx" ? "Đang xuất…" : "Xuất Excel"}</Button></div>} />
    <Panel title="Bộ lọc báo cáo" description="Chọn đợt và Đội để tổng hợp theo vườn, đơn vị và từng ngày nhập mủ."><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,auto)] lg:items-end"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Đợt báo cáo</label><select value={periodLabel} onChange={event => setPeriodLabel(event.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{periodOptions(periods).map(period => <option key={period} value={period}>{period}</option>)}</select></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Đội</label><select value={unitFilter} onChange={event => setUnitFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Tất cả Đội</option>{unitOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></div><div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span className="font-semibold">Công thức hao kho: </span>(cộng nhập − cộng xuất) / cộng nhập × 100%</div></div></Panel>
    <div className="mt-5 grid gap-4 md:grid-cols-3"><Summary label="Cộng nhập" value={totals.totalImport} tone="emerald" /><Summary label="Cộng xuất" value={totals.totalExport} tone="sky" /><Summary label="Hao kho" value={totalLossRate} suffix="%" tone={totalLossRate > 5 ? "amber" : "emerald"} /></div>
    <div className="mt-5"><Panel title="Chi tiết báo cáo" description={`Đợt: ${periodLabel || "chưa chọn"}${unitFilter ? ` · ${unitFilter}` : " · Tất cả Đội"}. Đơn vị tính: kg.`}>{isLoading ? <div className="grid h-60 place-items-center text-sm text-slate-400"><Loader2 className="mb-2 h-5 w-5 animate-spin" />Đang tổng hợp dữ liệu…</div> : error ? <div className="grid min-h-56 place-items-center rounded-xl border border-red-100 bg-red-50 p-8 text-center"><TriangleAlert className="h-7 w-7 text-red-600" /><p className="mt-3 font-semibold text-red-900">Không thể tải báo cáo</p><p className="mt-1 text-sm text-red-700">{error.message}</p></div> : !rows.length ? <EmptyState title={unitFilter ? `Chưa có dữ liệu ${unitFilter} cho đợt này` : "Chưa có dữ liệu cho đợt này"} description="Ghi nhận nhập mủ và xuất mủ cùng đợt để xem báo cáo tiến độ." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1180px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.08em] text-slate-400"><th rowSpan={2} className="px-3 py-3">STT</th><th rowSpan={2} className="px-3 py-3">Đơn vị / vườn</th>{dateColumns.length ? <th colSpan={dateColumns.length} className="border-l border-slate-200 px-3 py-3 text-center text-emerald-700">Nhập theo ngày — mủ đông</th> : null}<th colSpan={3} className="border-l border-slate-200 px-3 py-3 text-center text-emerald-700">Nhập mủ</th><th colSpan={3} className="border-l border-slate-200 px-3 py-3 text-center text-sky-700">Xuất mủ</th><th rowSpan={2} className="border-l border-slate-200 px-3 py-3 text-right">Hao kho</th></tr><tr className="border-b border-slate-200 text-xs font-bold text-slate-400">{dateColumns.map(date => <th key={date} className="border-l border-slate-100 px-3 py-3 text-right">{dayLabel(date)}</th>)}<th className="border-l border-slate-200 px-3 py-3 text-right">Cộng mủ đông</th><th className="px-3 py-3 text-right">Mủ dây</th><th className="px-3 py-3 text-right">Cộng nhập</th><th className="border-l border-slate-200 px-3 py-3 text-right">Mủ đông tạp</th><th className="px-3 py-3 text-right">Mủ dây</th><th className="px-3 py-3 text-right">Cộng xuất</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.code} className="border-b border-slate-100 hover:bg-emerald-50/30"><td className="px-3 py-4 text-slate-500">{index + 1}</td><td className="px-3 py-4"><p className="font-semibold text-slate-800">{row.name}</p><p className="mt-0.5 text-xs text-slate-400">{row.unit}</p></td>{dateColumns.map(date => <td key={date} className="border-l border-slate-100 px-3 py-4 text-right text-emerald-700">{amountOnDate(row, date) ? formatQuantity(amountOnDate(row, date)) : "—"}</td>)}<td className="border-l border-slate-100 px-3 py-4 text-right">{formatQuantity(row.frozenLatex)}</td><td className="px-3 py-4 text-right">{formatQuantity(row.latexThreadImport)}</td><td className="px-3 py-4 text-right font-bold text-emerald-700">{formatQuantity(row.totalImport)}</td><td className="border-l border-slate-100 px-3 py-4 text-right">{formatQuantity(row.frozenContaminatedLatex)}</td><td className="px-3 py-4 text-right">{formatQuantity(row.latexThreadExport)}</td><td className="px-3 py-4 text-right font-bold text-sky-700">{formatQuantity(row.totalExport)}</td><td className="border-l border-slate-100 px-3 py-4 text-right"><Badge className={row.lossRate > 5 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"}>{formatPercent(row.lossRate)}</Badge></td></tr>)}<tr className="bg-slate-50 font-bold text-slate-900"><td colSpan={2} className="px-3 py-4">CỘNG</td>{dateColumns.map(date => <td key={date} className="border-l border-slate-200 px-3 py-4 text-right">{formatQuantity(rows.reduce((sum, row) => sum + amountOnDate(row, date), 0))}</td>)}<td className="border-l border-slate-200 px-3 py-4 text-right">{formatQuantity(totals.frozenLatex)}</td><td className="px-3 py-4 text-right">{formatQuantity(totals.latexThreadImport)}</td><td className="px-3 py-4 text-right text-emerald-800">{formatQuantity(totals.totalImport)}</td><td className="border-l border-slate-200 px-3 py-4 text-right">{formatQuantity(totals.frozenContaminatedLatex)}</td><td className="px-3 py-4 text-right">{formatQuantity(totals.latexThreadExport)}</td><td className="px-3 py-4 text-right text-sky-800">{formatQuantity(totals.totalExport)}</td><td className="border-l border-slate-200 px-3 py-4 text-right">{formatPercent(totalLossRate)}</td></tr></tbody></table></div>}</Panel></div>
  </div>;
}

function Summary({ label, value, suffix = "kg", tone }: { label: string; value: number; suffix?: string; tone: "emerald" | "sky" | "amber" }) { const colors = { emerald: "bg-emerald-50 text-emerald-800", sky: "bg-sky-50 text-sky-800", amber: "bg-amber-50 text-amber-800" }; return <div className={`rounded-2xl p-5 ${colors[tone]}`}><p className="text-xs font-bold uppercase tracking-[0.12em] opacity-65">{label}</p><p className="font-display mt-2 text-3xl font-bold">{formatQuantity(value)} <span className="text-sm">{suffix}</span></p></div>; }
