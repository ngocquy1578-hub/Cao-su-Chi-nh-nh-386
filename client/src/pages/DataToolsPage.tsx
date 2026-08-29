import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader, Panel } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { comparePlotsByYearAndName } from "@/lib/plotOrder";
import { formatQuantity, STANDARD_PERIODS } from "@/lib/rubber";
import { parseWorkerPlotAllocationRows } from "@/lib/workerPlotAllocationImport";
import { trpc } from "@/lib/trpc";
import { compareTeamName } from "@shared/teamOrder";
import { Archive, CheckCircle2, Download, FileSpreadsheet, Loader2, TriangleAlert, Upload, UploadCloud } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type Dataset = "plots" | "plotIndicators" | "workers" | "teamImports" | "teamExports" | "workerPlotAllocations";
type TeamImportProgress = { unit: string; rows: number; status: "ready" | "importing" | "complete" | "error" };

const labels: Record<Dataset, string> = {
  plots: "Vườn / lô",
  plotIndicators: "Chỉ số cây định kỳ",
  workers: "Nhân công",
  teamImports: "Nhập mủ theo đội",
  teamExports: "Xuất mủ theo đội",
  workerPlotAllocations: "Phân chia nhân công vườn cây",
};

const samples: Record<Dataset, Record<string, string | number>> = {
  plots: { "Đơn vị": "", "Loại vườn": "A", "Tên lô": "", "Năm trồng": "", Giống: "", "Từ hàng": "", "Đến hàng": "", "Diện tích (ha)": "", "Tổng số hố kiểm kê": "", "Tổng số cây kiểm kê": "", "Cây cạo": "", "Mật độ cây cạo/ha": "", "Xếp hạng vườn cây": "" },
  plotIndicators: { "Mã lô": "", "Ngày cập nhật": "2026-08-22", "Tổng số hố kiểm kê": "", "Tổng số cây kiểm kê": "", "Cây cạo": "", "Cây chưa đủ tiêu chuẩn": "", "Cây không hiệu quả": "", "Cây bệnh không cạo": "", "Cây khô miệng cạo": "", "Hố trống": "", "Mật độ cây cạo/ha": "", "Xếp hạng vườn cây": "" },
  workers: { Đội: "", Tên: "", "Mã số": "", "Tên phiên âm": "", "Giới tính": "Nam", "Trạng thái làm việc": "Đang làm việc" },
  teamImports: { Đợt: "Đợt 1", Ngày: "", Đội: "", Vườn: "", "Mủ đông, tạp (kg)": "", "Mủ dây (kg)": "" },
  teamExports: { Đợt: "Đợt 1", Ngày: "", Đội: "", "Mủ đông, tạp (kg)": "", "Mủ dây (kg)": "" },
  workerPlotAllocations: { Đội: "Đội 1", "Nhân công": "", "Mã số nhân công": "", "Vườn A/B/C": "A", "Mã lô": "", "Từ hàng": "", "Đến hàng": "", "Diện tích (ha)": "" },
};

const text = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const number = (value: unknown) => Number(text(value).replaceAll(",", "")) || 0;
const canonical = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function parseDate(value: unknown, XLSX: any) {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00.000Z`);
  const parts = raw.split("-");
  if (parts.length === 3) return new Date(Date.UTC(2000 + Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])));
  throw new Error(`Ngày không hợp lệ: ${raw}`);
}

function groupTeamProgress(rows: Array<{ unit?: unknown }>): TeamImportProgress[] {
  const groups = rows.reduce((result, row) => {
    const unit = text(row.unit);
    if (unit) result.set(unit, (result.get(unit) ?? 0) + 1);
    return result;
  }, new Map<string, number>());
  return Array.from(groups).sort(([left], [right]) => left.localeCompare(right, "vi", { numeric: true })).map(([unit, rows]) => ({ unit, rows, status: "ready" }));
}

function detectDataset(headers: string[]): Dataset | null {
  const keys = headers.map(canonical);
  if (keys.includes("ma lo") && keys.includes("ngay cap nhat")) return "plotIndicators";
  if (keys.includes("ten lo")) return "plots";
  if (keys.includes("ten phien am")) return "workers";
  if (keys.includes("vuon")) return "teamImports";
  if (keys.includes("dot") && keys.includes("doi") && keys.some(key => key.startsWith("mu dong"))) return "teamExports";
  return null;
}

export default function DataToolsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { data: summary, error } = trpc.dataTools.summary.useQuery();
  const { data: teamImports } = trpc.dataTools.teamImports.useQuery();
  const { data: teamExports } = trpc.dataTools.teamExports.useQuery();
  const { data: backups, isLoading: backupsLoading } = trpc.dataTools.backups.list.useQuery(undefined, { enabled: isAdmin });
  const [dataset, setDataset] = useState<Dataset>("plots");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [teamProgress, setTeamProgress] = useState<TeamImportProgress[]>([]);
  const [result, setResult] = useState<{ label: string; processed: number; valid: number; errors: number } | null>(null);

  const completeImport = async (processed: number, label: string) => {
    const valid = rows.length;
    const errors = issues.length;
    await utils.dataTools.summary.invalidate();
    if (label === labels.teamImports) await utils.dataTools.teamImports.invalidate();
    if (label === labels.teamExports) await utils.dataTools.teamExports.invalidate();
    setTeamProgress(current => current.map(item => ({ ...item, status: "complete" })));
    setResult({ label, processed, valid, errors });
    setFile(null);
    setRows([]);
    setIssues([]);
    toast.success(`${label}: đã xử lý ${processed} dòng hợp lệ.`);
  };

  const failImport = (message: string) => {
    setTeamProgress(current => current.map(item => ({ ...item, status: "error" })));
    toast.error(message);
  };

  const plotImport = trpc.dataTools.import.plots.useMutation({ onSuccess: ({ imported }) => completeImport(imported, labels.plots), onError: error => failImport(error.message) });
  const indicatorImport = trpc.dataTools.import.plotIndicators.useMutation({ onSuccess: ({ updated }) => completeImport(updated, labels.plotIndicators), onError: error => failImport(error.message) });
  const workerImport = trpc.dataTools.import.workers.useMutation({ onSuccess: ({ imported }) => completeImport(imported, labels.workers), onError: error => failImport(error.message) });
  const teamImport = trpc.dataTools.import.teamImports.useMutation({ onSuccess: ({ imported }) => completeImport(imported, labels.teamImports), onError: error => failImport(error.message) });
  const teamExport = trpc.dataTools.import.teamExports.useMutation({ onSuccess: ({ imported }) => completeImport(imported, labels.teamExports), onError: error => failImport(error.message) });
  const allocationImport = trpc.dataTools.import.workerPlotAllocations.useMutation({ onSuccess: ({ imported }) => completeImport(imported, labels.workerPlotAllocations), onError: error => failImport(error.message) });
  const backupCreate = trpc.dataTools.backups.create.useMutation({
    onSuccess: async backup => { await utils.dataTools.backups.list.invalidate(); toast.success(`Đã tạo bản sao lưu ${backup.fileName}`); },
    onError: error => toast.error(error.message),
  });
  const backupDownload = trpc.dataTools.backups.download.useMutation({
    onSuccess: ({ url, fileName }) => { const link = document.createElement("a"); link.href = url; link.download = fileName; link.rel = "noopener"; document.body.appendChild(link); link.click(); link.remove(); },
    onError: error => toast.error(error.message),
  });
  const busy = plotImport.isPending || indicatorImport.isPending || workerImport.isPending || teamImport.isPending || teamExport.isPending || allocationImport.isPending;

  const reset = () => {
    setFile(null);
    setRows([]);
    setIssues([]);
    setTeamProgress([]);
    setResult(null);
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    const allocationHeaders = [
      ["STT", "Đội", "Nhân công (tên La tinh)", "Mã số nhân công", "Vườn A", "", "", "", "", "", "Vườn B", "", "", "", "", "", "Vườn C", "", "", "", "", ""],
      ["", "", "", "", "Mã lô", "Tên lô", "Năm trồng", "Từ hàng", "Đến hàng", "Diện tích (ha)", "Mã lô", "Tên lô", "Năm trồng", "Từ hàng", "Đến hàng", "Diện tích (ha)", "Mã lô", "Tên lô", "Năm trồng", "Từ hàng", "Đến hàng", "Diện tích (ha)"],
      [1, "Đội 1", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ];
    const sheet = dataset === "workerPlotAllocations" ? XLSX.utils.aoa_to_sheet(allocationHeaders) : XLSX.utils.json_to_sheet([samples[dataset]]);
    if (dataset === "workerPlotAllocations") sheet["!merges"] = ["A1:A2", "B1:B2", "C1:C2", "D1:D2", "E1:J1", "K1:P1", "Q1:V1"].map(XLSX.utils.decode_range);
    XLSX.utils.book_append_sheet(book, sheet, labels[dataset]);
    const guide = XLSX.utils.aoa_to_sheet([
      [`MẪU IMPORT ${labels[dataset].toUpperCase()}`],
      [dataset === "workerPlotAllocations" ? "Điền Mã lô, Từ hàng, Đến hàng và Diện tích trong nhóm Vườn A/B/C; hệ thống kiểm tra theo từng Đội." : "Xóa dòng trống mẫu và điền dữ liệu từ dòng 2."],
      ["Các bản ghi trùng khóa sẽ được cập nhật, không tạo bản sao."],
    ]);
    XLSX.utils.book_append_sheet(book, guide, "Hướng dẫn");
    XLSX.writeFile(book, `mau-import-${dataset}.xlsx`);
  };

  const downloadExport = async () => {
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    const [plots, workers, allocations, plotProductions] = await Promise.all([utils.rubber.plots.list.fetch(), utils.rubber.workforce.workers.list.fetch(), utils.dataTools.workerPlotAllocations.fetch(), utils.rubber.plotProduction.list.fetch()]);
    const orderedPlots = [...plots].sort((left, right) => compareTeamName(left.unit, right.unit) || comparePlotsByYearAndName(left, right));
    const orderedPlotProductions = [...plotProductions].sort((left, right) => compareTeamName(left.unit, right.unit) || comparePlotsByYearAndName({ plantedYear: left.plantedYear, name: left.plotName, code: left.plotCode }, { plantedYear: right.plantedYear, name: right.plotName, code: right.plotCode }));
    const sheets: [string, unknown[]][] = [
      ["Vườn lô", orderedPlots.map(plot => ({ "Mã lô": plot.code, "Tên lô": plot.name, "Đơn vị": plot.unit, "Loại vườn": plot.gardenType ?? "", "Từ hàng": plot.rowStart ?? "", "Đến hàng": plot.rowEnd ?? "", "Diện tích (ha)": plot.areaHa, "Năm trồng": plot.plantedYear ?? "", Giống: plot.cultivar ?? "", "Cây cạo": plot.tappingTrees ?? "", "Xếp hạng vườn cây": plot.plotRank ?? "" }))],
      ["Chỉ số cây", orderedPlots.map(plot => ({ "Mã lô": plot.code, "Ngày cập nhật": plot.indicatorDate ?? "", "Tổng số hố kiểm kê": plot.inventoryPits ?? "", "Tổng số cây kiểm kê": plot.inventoryTrees ?? "", "Cây cạo": plot.tappingTrees ?? "", "Cây chưa đủ tiêu chuẩn": plot.immatureTrees ?? "", "Cây không hiệu quả": plot.nonproductiveTrees ?? "", "Cây bệnh không cạo": plot.diseasedTrees ?? "", "Cây khô miệng cạo": plot.dryTappingTrees ?? "", "Hố trống": plot.emptyPits ?? "", "Mật độ cây cạo/ha": plot.tappingDensity ?? "", "Xếp hạng vườn cây": plot.plotRank ?? "" }))],
      ["Nhân công", workers.map(worker => ({ Đội: worker.unit ?? "", Tên: worker.name, "Mã số": worker.employeeCode ?? "", "Tên phiên âm": worker.phoneticName ?? "", "Giới tính": worker.gender === "female" ? "Nữ" : "Nam", "Trạng thái làm việc": worker.status === "active" ? "Đang làm việc" : "Không hoạt động" }))],
      ["Nhập mủ đội", (teamImports ?? []).map(row => ({ Đợt: row.periodLabel, Ngày: row.recordDate, Đội: row.unit, Vườn: row.gardenName, "Mủ đông, tạp (kg)": row.frozenLatex, "Mủ dây (kg)": row.latexThread, "Cộng nhập (kg)": row.totalImport }))],
      ["Xuất mủ đội", (teamExports ?? []).map(row => ({ Đợt: row.periodLabel, Ngày: row.recordDate, Đội: row.unit, "Mủ đông, tạp (kg)": row.frozenContaminatedLatex, "Mủ dây (kg)": row.latexThread, "Cộng xuất (kg)": row.totalExport }))],
      ["Sản lượng theo lô", orderedPlotProductions.map(row => ({ Ngày: row.recordDate, Đội: row.unit, "Mã lô": row.plotCode, "Tên lô": row.plotName, "Năm trồng": row.plantedYear ?? "", "Diện tích (ha)": row.areaHa, "Mủ đông, tạp (kg)": row.frozenContaminatedLatex, "Quy khô (kg)": row.dryRubber, "Ghi chú": row.note ?? "", Nguồn: row.source }))],
      ["Phân công nhân công", allocations.map(row => ({ Đội: row.unit ?? "", "Nhân công": row.workerName, "Mã số nhân công": row.employeeCode ?? "", "Vườn A/B/C": row.gardenType, "Mã lô": row.plotCode, "Tên lô": row.plotName, "Từ hàng": row.rowStart, "Đến hàng": row.rowEnd, "Diện tích (ha)": row.areaHa }))],
    ];
    sheets.forEach(([name, data]) => XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), name));
    XLSX.writeFile(book, "du-lieu-cao-su-chi-nhanh-386.xlsx");
  };

  const parseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setParsing(true);
    setTeamProgress([]);
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const book = XLSX.read(await selected.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = book.Sheets[book.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      const isAllocation = text(matrix[0]?.[2]).includes("Nhân công") && text(matrix[1]?.[4]).includes("Mã lô");
      if (isAllocation) {
        const allocation = parseWorkerPlotAllocationRows(matrix);
        if (!allocation.parsed.length) throw new Error(`Không có dòng phân chia hợp lệ. ${allocation.issues[0] ?? "Hãy điền Mã lô, hàng và diện tích."}`);
        setDataset("workerPlotAllocations");
        setFile(selected);
        setRows(allocation.parsed);
        setIssues(allocation.issues);
        setTeamProgress(groupTeamProgress(allocation.parsed));
        toast.success(`Đã đọc ${allocation.parsed.length} dòng phân chia nhân công vườn cây.`);
        return;
      }
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const detected = detectDataset(Object.keys(raw[0] ?? {}));
      if (!detected) throw new Error("Không nhận diện được loại dữ liệu. Tệp cần có các cột đúng theo mẫu Excel đã tải xuống.");
      const parsed: any[] = [];
      const errors: string[] = [];
      raw.forEach((row, index) => {
        try {
          const normalized = normalize(detected, row, XLSX);
          if (!normalized) throw new Error("thiếu cột bắt buộc hoặc giá trị không hợp lệ");
          parsed.push(normalized);
        } catch (error) {
          errors.push(`Dòng ${index + 2}: ${error instanceof Error ? error.message : "không hợp lệ"}`);
        }
      });
      if (!parsed.length) throw new Error(`Không có dòng hợp lệ. ${errors[0] ?? "Kiểm tra tiêu đề và định dạng ngày/số."}`);
      setDataset(detected);
      setFile(selected);
      setRows(parsed);
      setIssues(errors);
      setTeamProgress(groupTeamProgress(parsed));
      toast.success(`Đã nhận diện ${labels[detected]} và đọc ${parsed.length} dòng hợp lệ.`);
    } catch (error) {
      setFile(null);
      setRows([]);
      setIssues([error instanceof Error ? error.message : "Không thể đọc tệp Excel"]);
      toast.error(error instanceof Error ? error.message : "Không thể đọc tệp Excel");
    } finally {
      setParsing(false);
    }
  };

  const commit = () => {
    if (!rows.length) return;
    setTeamProgress(current => current.map(item => ({ ...item, status: "importing" })));
    if (dataset === "plots") plotImport.mutate({ rows });
    else if (dataset === "plotIndicators") indicatorImport.mutate({ rows });
    else if (dataset === "workers") workerImport.mutate({ rows });
    else if (dataset === "teamImports") teamImport.mutate({ rows });
    else if (dataset === "teamExports") teamExport.mutate({ rows });
    else allocationImport.mutate({ rows });
  };

  const previewColumns = useMemo(() => Object.keys(rows[0] ?? {}).slice(0, 5), [rows]);

  return <div className="page-enter">
    <PageHeader eyebrow="Quản trị dữ liệu" title="Import & export Excel" description="Nạp dữ liệu vườn/lô, nhân công và sản lượng theo đội; theo dõi tiến trình kiểm tra và nhập theo từng Đội." action={<Button variant="outline" onClick={downloadExport} className="bg-white"><Download className="mr-2 h-4 w-4" />Xuất toàn bộ Excel</Button>} />
    {error ? <div className="mb-5"><QueryError message={error.message} /></div> : null}
    <div className="grid gap-4 md:grid-cols-3"><Metric label="Lô vườn" value={summary?.plots ?? 0} /><Metric label="Nhân công" value={summary?.workers ?? 0} /><Metric label="Nhập / xuất theo đội" value={`${summary?.teamImports ?? 0} / ${summary?.teamExports ?? 0}`} /></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Panel title="Nạp dữ liệu từ Excel" description="Tải mẫu đúng loại dữ liệu, xem trước và kiểm tra tệp trước khi ghi vào hệ thống.">
        {isAdmin ? <div className="grid gap-4">
          <div className="grid gap-2"><Label>Loại dữ liệu</Label><Select value={dataset} onValueChange={value => { setDataset(value as Dataset); reset(); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(labels) as Dataset[]).map(key => <SelectItem key={key} value={key}>{labels[key]}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadTemplate}><FileSpreadsheet className="mr-2 h-4 w-4" />Tải mẫu Excel</Button><label className="inline-flex cursor-pointer items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><UploadCloud className="mr-2 h-4 w-4" />Chọn tệp Excel<input className="sr-only" type="file" accept=".xlsx,.xls" onChange={parseFile} /></label></div>
          {parsing ? <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm font-semibold text-sky-900"><Loader2 className="h-4 w-4 animate-spin" />Đang đọc và kiểm tra cấu trúc tệp Excel…</div> : null}
          {file ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-emerald-900">{file.name}</p><Badge className="bg-emerald-700">{rows.length} hợp lệ</Badge></div>
            <p className="mt-1 text-sm text-emerald-800">Đã nhận diện: {labels[dataset]}. Bản ghi trùng khóa sẽ được cập nhật, không tạo bản sao.</p>
            {teamProgress.length ? <TeamProgressPanel items={teamProgress} /> : null}
            <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-100 bg-white"><table className="w-full min-w-[420px] text-left text-xs"><thead className="bg-emerald-50 text-emerald-900"><tr>{previewColumns.map(key => <th key={key} className="px-3 py-2 font-bold">{key}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index} className="border-t border-slate-100">{Object.values(row).slice(0, 5).map((value, cell) => <td key={cell} className="max-w-32 truncate px-3 py-2 text-slate-600">{value instanceof Date ? value.toLocaleDateString("vi-VN") : String(value)}</td>)}</tr>)}</tbody></table></div>
            <p className="mt-2 text-xs text-emerald-800">Xem trước 5 dòng đầu trong {rows.length} dòng hợp lệ.</p>
            {issues.length ? <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><p className="font-bold">{issues.length} dòng lỗi đã bị bỏ qua</p>{issues.slice(0, 5).map(issue => <p key={issue} className="mt-1">• {issue}</p>)}</div> : null}
            <div className="mt-3 flex justify-end"><Button onClick={commit} disabled={busy} className="bg-emerald-700 hover:bg-emerald-800"><Upload className="mr-2 h-4 w-4" />{busy ? "Đang nhập…" : `Nhập ${rows.length} dòng`}</Button></div>
          </div> : <div className={issues.length ? "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" : "rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500"}>{issues.length ? `Không thể đọc tệp: ${issues[0]}` : "Chưa chọn tệp. Hệ thống tự nhận diện loại dữ liệu khi bạn chọn file Excel."}</div>}
          {result ? <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Đã hoàn tất import {result.label}</p><p className="mt-1">Đã xử lý {result.processed} dòng; {result.valid} dòng hợp lệ và {result.errors} dòng lỗi đã được báo trước.</p></div></div> : null}
        </div> : <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Chỉ quản trị viên có quyền import dữ liệu. Bạn vẫn có thể xuất dữ liệu hiện có.</div>}
      </Panel>
      <Panel title="Số liệu đã nhập" description="Tổng khối lượng theo dữ liệu đội được đối chiếu từ các tệp Excel."><div className="space-y-3"><Stat label="Tổng cộng nhập" value={`${formatQuantity(summary?.totalImport ?? 0)} kg`} tone="emerald" /><Stat label="Tổng cộng xuất" value={`${formatQuantity(summary?.totalExport ?? 0)} kg`} tone="sky" /><div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-600">Khi import lại, hệ thống nhận diện khóa dữ liệu và cập nhật số liệu hiện có để tránh trùng lặp.</div></div></Panel>
    </div>
    {isAdmin ? <Panel className="mt-5" title="Sao lưu dữ liệu hằng tuần" description="Tự động lúc 00:15 Chủ nhật (giờ Việt Nam), giữ 8 bản gần nhất. Bản sao loại trừ mật khẩu và bí mật xác thực."><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Quản trị viên có thể tạo bản sao ngay và tải các bản đã lưu.</p><Button onClick={() => backupCreate.mutate()} disabled={backupCreate.isPending} className="bg-emerald-700 hover:bg-emerald-800"><Archive className="mr-2 h-4 w-4" />{backupCreate.isPending ? "Đang sao lưu…" : "Sao lưu ngay"}</Button></div><div className="mt-4 overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.08em] text-slate-500"><tr><th className="px-4 py-3">Thời điểm</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Bản ghi</th><th className="px-4 py-3">Dung lượng</th><th className="px-4 py-3 text-right">Tải xuống</th></tr></thead><tbody>{backupsLoading ? <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang tải danh sách sao lưu…</td></tr> : backups?.length ? backups.map(backup => <tr key={backup.id} className="border-t border-slate-100"><td className="px-4 py-3 text-slate-700">{new Date(backup.createdAt).toLocaleString("vi-VN")}</td><td className="px-4 py-3"><Badge className={backup.source === "automatic" ? "bg-sky-700" : "bg-emerald-700"}>{backup.source === "automatic" ? "Tự động" : "Thủ công"}</Badge></td><td className="px-4 py-3 text-slate-700">{backup.recordCount.toLocaleString("vi-VN")}</td><td className="px-4 py-3 text-slate-700">{(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB</td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => backupDownload.mutate({ id: backup.id })} disabled={backupDownload.isPending}><Download className="mr-2 h-4 w-4" />Tải</Button></td></tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có bản sao lưu. Bấm Sao lưu ngay để tạo bản đầu tiên.</td></tr>}</tbody></table></div></Panel> : null}
  </div>;
}

function TeamProgressPanel({ items }: { items: TeamImportProgress[] }) {
  return <div className="mt-3 rounded-xl border border-sky-100 bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Tiến trình theo Đội</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{items.map(item => <div key={item.unit} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"><span className="font-semibold text-slate-800">{item.unit} <span className="font-normal text-slate-500">· {item.rows} dòng</span></span><span className={item.status === "complete" ? "text-emerald-700" : item.status === "error" ? "text-red-700" : item.status === "importing" ? "flex items-center gap-1 text-sky-700" : "text-slate-600"}>{item.status === "complete" ? <><CheckCircle2 className="mr-1 inline h-4 w-4" />Hoàn tất</> : item.status === "error" ? <><TriangleAlert className="mr-1 inline h-4 w-4" />Lỗi</> : item.status === "importing" ? <><Loader2 className="h-4 w-4 animate-spin" />Đang nhập</> : "Sẵn sàng"}</span></div>)}</div></div>;
}

function normalize(type: Dataset, row: Record<string, unknown>, XLSX: any) {
  if (type === "plots") {
    const unit = text(row["Đơn vị"]); const lot = text(row["Tên lô"]); const year = number(row["Năm trồng"]); const areaHa = number(row["Diện tích (ha)"]);
    const rawGardenType = text(row["Loại vườn"]).toUpperCase(); const gardenType = rawGardenType ? (rawGardenType === "A" || rawGardenType === "B" || rawGardenType === "C" ? rawGardenType : null) : null;
    const rowStart = number(row["Từ hàng"]) || null; const rowEnd = number(row["Đến hàng"]) || null;
    if (!unit || !lot || !areaHa || (rawGardenType && !gardenType) || (rowStart && rowEnd && rowEnd < rowStart)) throw new Error("thiếu dữ liệu bắt buộc, Loại vườn phải là A/B/C hoặc khoảng hàng không hợp lệ");
    const code = text(row["Mã lô"]) || `LO-${unit}-${year}-${lot}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toUpperCase().slice(0, 48);
    return { code, name: text(row["Tên lô"]) || `Lô ${lot} (${year})`, unit, gardenType, rowStart, rowEnd, areaHa, plantedYear: year || null, cultivar: text(row["Giống"]) || null, inventoryPits: number(row["Tổng số hố kiểm kê"]) || null, inventoryTrees: number(row["Tổng số cây kiểm kê"]) || null, tappingTrees: number(row["Cây cạo"]) || null, tappingDensity: number(row["Mật độ cây cạo/ha"]) || null, plotRank: text(row["Xếp hạng vườn cây"]) || text(row["Xếp hạng"]) || null, note: null };
  }
  if (type === "plotIndicators") { const code = text(row["Mã lô"]); if (!code) throw new Error("thiếu Mã lô"); return { code, indicatorDate: parseDate(row["Ngày cập nhật"], XLSX), inventoryPits: number(row["Tổng số hố kiểm kê"]), inventoryTrees: number(row["Tổng số cây kiểm kê"]), tappingTrees: number(row["Cây cạo"]), immatureTrees: number(row["Cây chưa đủ tiêu chuẩn"]), nonproductiveTrees: number(row["Cây không hiệu quả"]), diseasedTrees: number(row["Cây bệnh không cạo"]), dryTappingTrees: number(row["Cây khô miệng cạo"]), emptyPits: number(row["Hố trống"]), tappingDensity: number(row["Mật độ cây cạo/ha"]), plotRank: text(row["Xếp hạng vườn cây"]) || null }; }
  if (type === "workers") { const unit = text(row["Đội"]); const name = text(row["Tên"]); if (!unit || !name) return null; const rawStatus = text(row["Trạng thái làm việc"]) || text(row["Trạng thái"]); return { unit, name, employeeCode: text(row["Mã số"]) || null, phoneticName: text(row["Tên phiên âm"]) || null, gender: text(row["Giới tính"]) === "Nữ" ? "female" : "male", status: rawStatus === "Đang làm việc" || !rawStatus ? "active" : "inactive", roleTitle: "Công nhân khai thác", note: rawStatus ? `Trạng thái nguồn: ${rawStatus}` : null }; }
  const unit = text(row["Đội"]); const periodLabel = text(row["Đợt"]); if (!unit || !periodLabel || !STANDARD_PERIODS.includes(periodLabel as typeof STANDARD_PERIODS[number])) throw new Error(`Đợt chỉ nhận: ${STANDARD_PERIODS.join(", ")}`); const recordDate = parseDate(row["Ngày"], XLSX);
  if (type === "teamImports") { const gardenName = text(row["Vườn"]); if (!gardenName) return null; return { unit, gardenName, periodLabel, recordDate, frozenLatex: number(row["Mủ đông, tạp (kg)"]), latexThread: number(row["Mủ dây (kg)"]) }; }
  return { unit, periodLabel, recordDate, frozenContaminatedLatex: number(row["Mủ đông, tạp (kg)"]), latexThread: number(row["Mủ dây (kg)"]) };
}

function Metric({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="font-display mt-2 text-3xl font-bold text-slate-900">{value}</p></div>; }
function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "sky" }) { return <div className={tone === "emerald" ? "rounded-xl bg-emerald-50 p-4 text-emerald-900" : "rounded-xl bg-sky-50 p-4 text-sky-900"}><p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
