import { EmptyState, PageHeader, Panel } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { monthStartDate, monthYearLabel } from "@/lib/plotProductionPeriod";
import { aggregatePlotProduction, aggregatePlotProductionByTeam, plotProductionExcelRows } from "@/lib/plotProduction";
import { comparePlotsByTeamYearAndName } from "@/lib/plotOrder";
import { formatAreaHa, formatQuantity } from "@/lib/rubber";
import { trpc } from "@/lib/trpc";
import { compareTeamName } from "@shared/teamOrder";
import { Download, FileSpreadsheet, Loader2, LockKeyhole, LockKeyholeOpen, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

type ImportRow = { plotId: number; recordDate: Date; frozenContaminatedLatex: number; dryRubber: number; note?: string };
type QuickEntry = { plotId: string; frozenContaminatedLatex: string; dryRubber: string; note: string };

const teamProductionConfig = {
  frozenContaminatedLatex: { label: "Mủ đông, tạp", color: "#059669" },
  dryRubber: { label: "Quy khô", color: "#0284c7" },
};

const text = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const canonical = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const inputNumber = (value: unknown) => {
  const raw = text(value);
  if (typeof value === "number") return value;
  if (raw.includes(",") && raw.includes(".")) return Number(raw.replaceAll(".", "").replace(",", "."));
  return Number(raw.replace(",", "."));
};
const periodKey = (year: string | number, month: string | number) => `${year}-${month}`;

function readDate(value: unknown, XLSX: typeof import("xlsx")) {
  if (typeof value === "number") {
    const decoded = XLSX.SSF.parse_date_code(value);
    if (decoded) return new Date(Date.UTC(decoded.y, decoded.m - 1, decoded.d, 12));
  }
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T12:00:00.000Z`);
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12));
  throw new Error(`Ngày không hợp lệ: ${raw || "trống"}`);
}

export default function PlotProductionPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: plots, error: plotsError } = trpc.rubber.plots.list.useQuery();
  const { data: entries, isLoading, error: entriesError } = trpc.rubber.plotProduction.list.useQuery();
  const { data: periodLocks = [] } = trpc.rubber.plotProduction.periodLocks.useQuery();
  const [unit, setUnit] = useState("all");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [form, setForm] = useState(() => ({ plotId: "", year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1), frozenContaminatedLatex: "", dryRubber: "", note: "" }));
  const [quickUnit, setQuickUnit] = useState("");
  const [quickYear, setQuickYear] = useState(() => String(new Date().getFullYear()));
  const [quickMonth, setQuickMonth] = useState(() => String(new Date().getMonth() + 1));
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);

  const units = useMemo(() => Array.from(new Set((plots ?? []).map(plot => plot.unit))).sort(compareTeamName), [plots]);
  const years = useMemo(() => Array.from(new Set([new Date().getFullYear(), ...(entries ?? []).map(row => new Date(row.recordDate).getUTCFullYear())])).sort((a, b) => b - a), [entries]);
  const reportRows = useMemo(() => aggregatePlotProduction(entries ?? [], { year: year === "all" ? undefined : Number(year), month: month === "all" ? undefined : Number(month), unit: unit === "all" ? undefined : unit }), [entries, year, month, unit]);
  const totals = useMemo(() => reportRows.reduce((sum, row) => ({ frozen: sum.frozen + row.frozenContaminatedLatex, dry: sum.dry + row.dryRubber }), { frozen: 0, dry: 0 }), [reportRows]);
  const teamProductionRows = useMemo(() => aggregatePlotProductionByTeam(reportRows), [reportRows]);
  const selectedPlot = useMemo(() => (plots ?? []).find(plot => String(plot.id) === form.plotId), [plots, form.plotId]);
  const quickPlots = useMemo(() => [...(plots ?? []).filter(plot => plot.unit === quickUnit)].sort(comparePlotsByTeamYearAndName), [plots, quickUnit]);
  const lockedPeriodKeys = useMemo(() => new Set(periodLocks.map(lock => periodKey(lock.year, lock.month))), [periodLocks]);
  const manualPeriodLocked = lockedPeriodKeys.has(periodKey(form.year, form.month));
  const quickPeriodLocked = lockedPeriodKeys.has(periodKey(quickYear, quickMonth));
  const importLockedPeriod = useMemo(() => importRows.map(row => periodKey(row.recordDate.getUTCFullYear(), row.recordDate.getUTCMonth() + 1)).find(key => lockedPeriodKeys.has(key)), [importRows, lockedPeriodKeys]);
  const isAdmin = user?.role === "admin";

  const invalidate = async () => { await Promise.all([utils.rubber.plotProduction.list.invalidate(), utils.rubber.plotProduction.periodLocks.invalidate()]); };
  const create = trpc.rubber.plotProduction.create.useMutation({ onSuccess: async () => { await invalidate(); toast.success("Đã lưu sản lượng theo lô"); setForm(current => ({ ...current, frozenContaminatedLatex: "", dryRubber: "", note: "" })); }, onError: error => toast.error(error.message) });
  const importProduction = trpc.rubber.plotProduction.import.useMutation({ onSuccess: async ({ imported }) => { await invalidate(); setImportRows([]); setFileName(""); setIssues([]); toast.success(`Đã nhập ${imported} dòng sản lượng theo lô`); }, onError: error => toast.error(error.message) });
  const quickCreate = trpc.rubber.plotProduction.bulkCreate.useMutation({ onSuccess: async ({ imported }) => { await invalidate(); setQuickEntries([]); toast.success(`Đã lưu nhanh ${imported} Lô`); }, onError: error => toast.error(error.message) });
  const lockPeriod = trpc.rubber.plotProduction.lockPeriod.useMutation({ onSuccess: async () => { await invalidate(); toast.success(`Đã chốt Tháng ${form.month}/${form.year}`); }, onError: error => toast.error(error.message) });
  const unlockPeriod = trpc.rubber.plotProduction.unlockPeriod.useMutation({ onSuccess: async () => { await invalidate(); toast.success(`Đã mở khóa Tháng ${form.month}/${form.year}`); }, onError: error => toast.error(error.message) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (manualPeriodLocked) return toast.error(`Tháng ${form.month}/${form.year} đã chốt`);
    if (!selectedPlot) return toast.error("Chọn đúng Lô từ dữ liệu hệ thống");
    create.mutate({ plotId: selectedPlot.id, recordDate: monthStartDate(Number(form.year), Number(form.month)), frozenContaminatedLatex: Number(form.frozenContaminatedLatex), dryRubber: Number(form.dryRubber), note: form.note || undefined });
  };

  const addQuickEntry = () => {
    if (!quickUnit) return toast.error("Chọn Đội trước khi thêm Lô");
    setQuickEntries(current => current.length >= 200 ? current : [...current, { plotId: "", frozenContaminatedLatex: "", dryRubber: "", note: "" }]);
  };
  const updateQuickEntry = (index: number, data: Partial<QuickEntry>) => setQuickEntries(current => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...data } : entry));
  const submitQuickEntries = (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!quickUnit) throw new Error("Chọn Đội trước khi lưu");
      if (quickPeriodLocked) throw new Error(`Tháng ${quickMonth}/${quickYear} đã chốt`);
      if (!quickEntries.length) throw new Error("Thêm ít nhất một Lô để nhập nhanh");
      const plotIds = new Set<number>();
      const rows = quickEntries.map(entry => {
        const plotId = Number(entry.plotId);
        const plot = quickPlots.find(item => item.id === plotId);
        if (!plot) throw new Error("Chọn đúng Lô thuộc Đội đã chọn");
        if (plotIds.has(plotId)) throw new Error(`Lô ${plot.name} bị lặp trong danh sách nhập nhanh`);
        plotIds.add(plotId);
        const frozenContaminatedLatex = Number(entry.frozenContaminatedLatex);
        const dryRubber = Number(entry.dryRubber);
        if (!Number.isFinite(frozenContaminatedLatex) || frozenContaminatedLatex < 0 || !Number.isFinite(dryRubber) || dryRubber < 0) throw new Error("Mủ đông/tạp và Quy khô phải là số không âm");
        return { plotId, recordDate: monthStartDate(Number(quickYear), Number(quickMonth)), frozenContaminatedLatex, dryRubber, note: entry.note || undefined };
      });
      quickCreate.mutate({ rows });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Dữ liệu nhập nhanh không hợp lệ"); }
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const rows = [...(plots ?? [])].sort(comparePlotsByTeamYearAndName).map(plot => ({ Tháng: "", Năm: "", Đội: plot.unit, "Mã lô": plot.code, "Tên lô": plot.name, "Năm trồng": plot.plantedYear ?? "", "Diện tích (ha)": plot.areaHa, "Mủ đông, tạp (kg)": "", "Quy khô (kg)": "", "Ghi chú": "" }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Sản lượng theo lô");
    const guide = XLSX.utils.aoa_to_sheet([["HƯỚNG DẪN IMPORT SẢN LƯỢNG THEO LÔ"], ["Giữ nguyên Mã lô hoặc Tên lô để hệ thống nhận diện đúng lô. Điền Tháng, Năm, Mủ đông/tạp và Quy khô; các cột Đội, năm trồng, diện tích được đối chiếu từ danh mục lô."], ["Bản ghi trùng Lô, Tháng và Năm sẽ được cập nhật, không tạo bản sao. Mẫu Ngày cũ vẫn được hỗ trợ để giữ tương thích dữ liệu lịch sử."]]);
    XLSX.utils.book_append_sheet(workbook, guide, "Hướng dẫn");
    XLSX.writeFile(workbook, "mau-import-san-luong-theo-lo.xlsx");
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParsing(true); setIssues([]);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const byCode = new Map((plots ?? []).map(plot => [canonical(plot.code), plot]));
      const byName = new Map((plots ?? []).map(plot => [canonical(plot.name), plot]));
      const parsed: ImportRow[] = []; const errors: string[] = [];
      raw.forEach((row, index) => {
        try {
          const cells = Object.fromEntries(Object.entries(row).map(([key, value]) => [canonical(key), value]));
          const plot = byCode.get(canonical(text(cells["ma lo"]))) ?? byName.get(canonical(text(cells["ten lo"])));
          if (!plot) throw new Error("Mã lô hoặc Tên lô không khớp danh mục hệ thống");
          const frozenRaw = cells["mu dong tap kg"]; const dryRaw = cells["quy kho kg"];
          if (text(frozenRaw) === "" && text(dryRaw) === "") throw new Error("cần nhập Mủ đông/tạp hoặc Quy khô");
          const frozenContaminatedLatex = text(frozenRaw) === "" ? 0 : inputNumber(frozenRaw);
          const dryRubber = text(dryRaw) === "" ? 0 : inputNumber(dryRaw);
          if (!Number.isFinite(frozenContaminatedLatex) || frozenContaminatedLatex < 0 || !Number.isFinite(dryRubber) || dryRubber < 0) throw new Error("Mủ đông/tạp và Quy khô phải là số không âm");
          const hasMonthYear = text(cells.thang) !== "" || text(cells.nam) !== "";
          const recordDate = hasMonthYear ? monthStartDate(inputNumber(cells.nam), inputNumber(cells.thang)) : readDate(cells.ngay, XLSX);
          parsed.push({ plotId: plot.id, recordDate, frozenContaminatedLatex, dryRubber, note: text(cells["ghi chu"]) || undefined });
        } catch (error) { errors.push(`Dòng ${index + 2}: ${error instanceof Error ? error.message : "không hợp lệ"}`); }
      });
      if (!parsed.length) throw new Error(errors[0] ?? "Không có dòng hợp lệ");
      setFileName(file.name); setImportRows(parsed); setIssues(errors); toast.success(`Đã đọc ${parsed.length} dòng sản lượng theo lô`);
    } catch (error) { setFileName(""); setImportRows([]); setIssues([error instanceof Error ? error.message : "Không thể đọc tệp Excel"]); toast.error(error instanceof Error ? error.message : "Không thể đọc tệp Excel"); }
    finally { setParsing(false); event.target.value = ""; }
  };

  const exportReport = async () => {
    if (!reportRows.length) return toast.error("Không có sản lượng theo lô trong tập lọc");
    const XLSX = await import("xlsx"); const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["TỔNG HỢP SẢN LƯỢNG THEO LÔ"], [`Đội: ${unit === "all" ? "Tất cả Đội" : unit}`], [`Năm: ${year === "all" ? "Tất cả năm" : year}`], [`Tháng: ${month === "all" ? "Tất cả tháng" : `Tháng ${month}`}`], []]);
    XLSX.utils.sheet_add_json(sheet, plotProductionExcelRows(reportRows), { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, sheet, "Tổng hợp sản lượng lô");
    XLSX.writeFile(workbook, `tong-hop-san-luong-theo-lo-${unit === "all" ? "tat-ca-doi" : unit.replace(/\s+/g, "-")}-${year === "all" ? "tat-ca-nam" : year}-${month === "all" ? "tat-ca-thang" : `thang-${month}`}.xlsx`);
  };

  return <div className="page-enter">
    <PageHeader eyebrow="Báo cáo sản lượng" title="Sản lượng theo lô" description="Nhập Mủ đông/tạp và Quy khô theo từng Lô có sẵn trong hệ thống; tra cứu theo năm, tháng và Đội." action={<Button variant="outline" className="bg-white" onClick={exportReport}><Download className="mr-2 h-4 w-4" />Xuất Excel</Button>} />
    {plotsError || entriesError ? <div className="mb-5"><QueryError message={plotsError?.message || entriesError?.message} /></div> : null}
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.45fr]">
      <div className="space-y-5">
        <Panel title="Nhập sản lượng theo lô" description="Chọn đúng tên Lô và lập số liệu theo Tháng/Năm; mỗi Lô chỉ có một bản ghi cho một tháng.">
          <form onSubmit={submit} className="grid gap-3">
            <Field label="Lô"><select value={form.plotId} onChange={event => setForm(current => ({ ...current, plotId: event.target.value }))} required disabled={manualPeriodLocked} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><option value="">Chọn Lô</option>{[...(plots ?? [])].sort(comparePlotsByTeamYearAndName).map(plot => <option key={plot.id} value={plot.id}>{plot.unit} · {plot.name} ({plot.code})</option>)}</select></Field>
            {selectedPlot ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Năm trồng: <strong>{selectedPlot.plantedYear ?? "—"}</strong> · Diện tích: <strong>{formatAreaHa(selectedPlot.areaHa)} ha</strong></p> : null}
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Tháng"><select value={form.month} onChange={event => setForm(current => ({ ...current, month: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Array.from({ length: 12 }, (_, index) => index + 1).map(item => <option key={item} value={item}>Tháng {item}</option>)}</select></Field><Field label="Năm"><select value={form.year} onChange={event => setForm(current => ({ ...current, year: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{years.map(item => <option key={item} value={item}>Năm {item}</option>)}</select></Field></div>
            <PeriodLockNotice year={form.year} month={form.month} locked={manualPeriodLocked} isAdmin={isAdmin} pending={lockPeriod.isPending || unlockPeriod.isPending} onLock={() => lockPeriod.mutate({ year: Number(form.year), month: Number(form.month) })} onUnlock={() => unlockPeriod.mutate({ year: Number(form.year), month: Number(form.month) })} />
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Mủ đông, tạp (kg)"><Input type="number" min="0" step="0.01" value={form.frozenContaminatedLatex} onChange={event => setForm(current => ({ ...current, frozenContaminatedLatex: event.target.value }))} required disabled={manualPeriodLocked} /></Field><Field label="Quy khô (kg)"><Input type="number" min="0" step="0.01" value={form.dryRubber} onChange={event => setForm(current => ({ ...current, dryRubber: event.target.value }))} required disabled={manualPeriodLocked} /></Field></div>
            <Field label="Ghi chú"><Textarea value={form.note} onChange={event => setForm(current => ({ ...current, note: event.target.value }))} placeholder="Ghi chú (nếu có)" disabled={manualPeriodLocked} /></Field>
            <Button disabled={create.isPending || manualPeriodLocked} className="bg-emerald-700 hover:bg-emerald-800">{create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{manualPeriodLocked ? "Kỳ đã chốt" : create.isPending ? "Đang lưu…" : "Lưu sản lượng"}</Button>
          </form>
        </Panel>
        <Panel title="Nhập nhanh nhiều Lô" description="Nhập nhiều Lô cùng một Đội và cùng Tháng/Năm để lưu một lần.">
          <form onSubmit={submitQuickEntries} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3"><Field label="Đội"><select value={quickUnit} onChange={event => { setQuickUnit(event.target.value); setQuickEntries([]); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Chọn Đội</option>{units.map(item => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="Tháng"><select value={quickMonth} onChange={event => setQuickMonth(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Array.from({ length: 12 }, (_, index) => index + 1).map(item => <option key={item} value={item}>Tháng {item}</option>)}</select></Field><Field label="Năm"><select value={quickYear} onChange={event => setQuickYear(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{years.map(item => <option key={item} value={item}>Năm {item}</option>)}</select></Field></div>
            {quickPeriodLocked ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Tháng {quickMonth}/{quickYear} đã chốt. Không thể thêm hoặc chỉnh sửa sản lượng.</p> : null}
            <div className="space-y-3">{quickEntries.map((entry, index) => <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="grid gap-3 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"><Field label="Lô"><select value={entry.plotId} onChange={event => updateQuickEntry(index, { plotId: event.target.value })} disabled={quickPeriodLocked} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-50"><option value="">Chọn Lô</option>{quickPlots.map(plot => <option key={plot.id} value={plot.id} disabled={quickEntries.some((item, itemIndex) => itemIndex !== index && item.plotId === String(plot.id))}>{plot.name} ({plot.plantedYear ?? "—"})</option>)}</select></Field><Field label="Mủ đông/tạp"><Input type="number" min="0" step="0.01" value={entry.frozenContaminatedLatex} onChange={event => updateQuickEntry(index, { frozenContaminatedLatex: event.target.value })} disabled={quickPeriodLocked} required /></Field><Field label="Quy khô"><Input type="number" min="0" step="0.01" value={entry.dryRubber} onChange={event => updateQuickEntry(index, { dryRubber: event.target.value })} disabled={quickPeriodLocked} required /></Field><Button type="button" variant="ghost" size="icon" className="mt-7 text-slate-500 hover:text-red-600" onClick={() => setQuickEntries(current => current.filter((_, entryIndex) => entryIndex !== index))} aria-label="Xóa Lô" disabled={quickPeriodLocked}><Trash2 className="h-4 w-4" /></Button></div><Input className="mt-3" value={entry.note} onChange={event => updateQuickEntry(index, { note: event.target.value })} placeholder="Ghi chú cho Lô (nếu có)" disabled={quickPeriodLocked} /></div>)}</div>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="bg-white" onClick={addQuickEntry} disabled={!quickUnit || quickPeriodLocked || quickEntries.length >= 200}><Plus className="mr-2 h-4 w-4" />Thêm Lô</Button><Button disabled={!quickEntries.length || quickCreate.isPending || quickPeriodLocked} className="bg-emerald-700 hover:bg-emerald-800">{quickCreate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{quickCreate.isPending ? "Đang lưu…" : `Lưu ${quickEntries.length} Lô`}</Button></div>
          </form>
        </Panel>
        <Panel title="Import Excel" description="Dùng mẫu để nhập hàng loạt theo Tháng/Năm và Mã lô hoặc Tên lô. Dữ liệu lô được đối chiếu với hệ thống."><div className="grid gap-3"><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={downloadTemplate}><FileSpreadsheet className="mr-2 h-4 w-4" />Tải mẫu</Button><label className="inline-flex cursor-pointer items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><UploadCloud className="mr-2 h-4 w-4" />Chọn tệp Excel<input className="sr-only" type="file" accept=".xlsx,.xls" onChange={readFile} /></label></div>{parsing ? <p className="flex items-center gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-800"><Loader2 className="h-4 w-4 animate-spin" />Đang kiểm tra tệp…</p> : null}{fileName ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="font-semibold text-emerald-900">{fileName} · {importRows.length} dòng hợp lệ</p>{importLockedPeriod ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">Kỳ {importLockedPeriod.replace("-", "/")} đã chốt. Không thể nhập tệp này.</p> : null}<div className="mt-2 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-xs"><thead><tr className="border-b border-emerald-100"><th className="p-2">Đội</th><th className="p-2">Lô</th><th className="p-2">Tháng/Năm</th><th className="p-2 text-right">Mủ đông/tạp</th><th className="p-2 text-right">Quy khô</th></tr></thead><tbody>{importRows.slice(0, 5).map((row, index) => { const plot = (plots ?? []).find(item => item.id === row.plotId); return <tr key={`${row.plotId}-${index}`}><td className="p-2">{plot?.unit}</td><td className="p-2">{plot?.name}</td><td className="p-2">{monthYearLabel(row.recordDate)}</td><td className="p-2 text-right">{formatQuantity(row.frozenContaminatedLatex)}</td><td className="p-2 text-right">{formatQuantity(row.dryRubber)}</td></tr>; })}</tbody></table></div><Button type="button" className="mt-3 bg-emerald-700 hover:bg-emerald-800" disabled={importProduction.isPending || Boolean(importLockedPeriod)} onClick={() => importProduction.mutate({ rows: importRows })}>{importProduction.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}{importProduction.isPending ? "Đang nhập…" : `Nhập ${importRows.length} dòng`}</Button></div> : null}{issues.length ? <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><p className="font-bold">{issues.length} dòng không hợp lệ</p>{issues.slice(0, 3).map(issue => <p key={issue} className="mt-1">• {issue}</p>)}</div> : null}</div></Panel>
      </div>
      <Panel title="Tổng hợp sản lượng theo lô" description="Theo mẫu Đội, Lô, Năm trồng, Diện tích, Mủ đông/tạp và Quy khô.">
        <div className="mb-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3"><Field label="Đội"><select value={unit} onChange={event => setUnit(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="all">Tất cả Đội</option>{units.map(item => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="Năm"><select value={year} onChange={event => { setYear(event.target.value); setMonth("all"); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="all">Tất cả năm</option>{years.map(item => <option key={item} value={item}>Năm {item}</option>)}</select></Field><Field label="Tháng"><select value={month} onChange={event => setMonth(event.target.value)} disabled={year === "all"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"><option value="all">Tất cả tháng</option>{Array.from({ length: 12 }, (_, index) => index + 1).map(item => <option key={item} value={item}>Tháng {item}</option>)}</select></Field></div>
        <div className="mb-4 grid grid-cols-2 gap-3"><Summary label="Mủ đông, tạp" value={totals.frozen} /><Summary label="Quy khô" value={totals.dry} /></div>
        <div className="mb-4"><p className="mb-2 text-sm font-semibold text-slate-700">So sánh sản lượng theo Đội</p>{teamProductionRows.length ? <ChartContainer config={teamProductionConfig} className="h-56 w-full"><BarChart data={teamProductionRows} barGap={6}><CartesianGrid vertical={false} /><XAxis dataKey="unit" tickLine={false} axisLine={false} /><YAxis tickFormatter={formatQuantity} width={62} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => `${formatQuantity(Number(value))} kg`} />} /><Bar dataKey="frozenContaminatedLatex" name="frozenContaminatedLatex" fill="var(--color-frozenContaminatedLatex)" radius={[4, 4, 0, 0]} /><Bar dataKey="dryRubber" name="dryRubber" fill="var(--color-dryRubber)" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer> : <div className="grid h-40 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">Chưa có dữ liệu sản lượng theo lô trong phạm vi Tháng/Năm và Đội đang chọn.</div>}</div>
        {isLoading ? <div className="h-56 animate-pulse rounded-xl bg-slate-100" /> : !reportRows.length ? <EmptyState title="Chưa có sản lượng theo lô" description="Nhập tay, nhập nhanh hoặc import Excel theo Tháng/Năm và đúng tên Lô để hình thành tổng hợp. Hệ thống không phân bổ số liệu Đội hiện có sang Lô khi chưa có dữ liệu nguồn." /> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><th className="px-3 py-3">STT</th><th className="px-3 py-3">Đội</th><th className="px-3 py-3">Lô</th><th className="px-3 py-3 text-right">Năm trồng</th><th className="px-3 py-3 text-right">Diện tích (ha)</th><th className="px-3 py-3 text-right">Mủ đông, tạp</th><th className="px-3 py-3 text-right">Quy khô</th></tr></thead><tbody>{reportRows.map((row, index) => <tr key={row.plotId} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 text-slate-500">{index + 1}</td><td className="px-3 py-4 font-semibold text-slate-700">{row.unit}</td><td className="px-3 py-4"><p className="font-semibold text-slate-800">{row.plotName}</p><p className="text-xs text-slate-500">{row.plotCode}</p></td><td className="px-3 py-4 text-right">{row.plantedYear ?? "—"}</td><td className="px-3 py-4 text-right">{formatAreaHa(row.areaHa)}</td><td className="px-3 py-4 text-right font-semibold text-emerald-700">{formatQuantity(row.frozenContaminatedLatex)} kg</td><td className="px-3 py-4 text-right font-semibold text-sky-700">{formatQuantity(row.dryRubber)} kg</td></tr>)}</tbody><tfoot><tr className="bg-slate-50 font-bold text-slate-900"><td colSpan={5} className="px-3 py-4">Tổng khối lượng</td><td className="px-3 py-4 text-right text-emerald-700">{formatQuantity(totals.frozen)} kg</td><td className="px-3 py-4 text-right text-sky-700">{formatQuantity(totals.dry)} kg</td></tr></tfoot></table></div>}
      </Panel>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{children}</div>; }
function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"><p className="text-xs font-semibold text-emerald-800">{label}</p><p className="mt-1 text-xl font-bold text-emerald-900">{formatQuantity(value)} <span className="text-xs">kg</span></p></div>; }
function PeriodLockNotice({ year, month, locked, isAdmin, pending, onLock, onUnlock }: { year: string; month: string; locked: boolean; isAdmin: boolean; pending: boolean; onLock: () => void; onUnlock: () => void }) { return <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${locked ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}><span className="flex items-center gap-2 font-medium">{locked ? <LockKeyhole className="h-4 w-4" /> : <LockKeyholeOpen className="h-4 w-4" />}{locked ? `Tháng ${month}/${year} đã chốt` : `Tháng ${month}/${year} chưa chốt`}</span>{isAdmin ? <Button type="button" size="sm" variant={locked ? "outline" : "default"} className={locked ? "bg-white" : "bg-emerald-700 hover:bg-emerald-800"} disabled={pending} onClick={locked ? onUnlock : onLock}>{pending ? "Đang xử lý…" : locked ? "Mở khóa" : "Chốt tháng"}</Button> : null}</div>; }
