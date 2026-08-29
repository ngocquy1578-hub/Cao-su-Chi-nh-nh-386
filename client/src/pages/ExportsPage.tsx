import { EmptyState, PageHeader, Panel } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PERIOD, STANDARD_PERIODS, formatDate, formatQuantity, toDateInput } from "@/lib/rubber";
import { calculateProjectedWarehouseLoss } from "@/lib/exportWarehouseLoss";
import { filterTeamExportJournal, toTeamExportExcelRows } from "@/lib/exportJournal";
import { trpc } from "@/lib/trpc";
import { comparePeriodLabel, compareTeamName } from "@shared/teamOrder";
import { Calculator, Download, RotateCcw, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ExportsPage() {
  const utils = trpc.useUtils();
  const { data: plots, error: plotsError } = trpc.rubber.plots.list.useQuery();
  const { data: records, isLoading, error: recordsError } = trpc.rubber.exports.teamList.useQuery();
  const [unit, setUnit] = useState("");
  const [periodLabel, setPeriodLabel] = useState<string>(DEFAULT_PERIOD);
  const [recordDate, setRecordDate] = useState(toDateInput());
  const [frozenContaminatedLatex, setFrozenContaminatedLatex] = useState("");
  const [latexThread, setLatexThread] = useState("");
  const [note, setNote] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [journalPeriod, setJournalPeriod] = useState("");
  const totalExport = useMemo(() => Number(frozenContaminatedLatex || 0) + Number(latexThread || 0), [frozenContaminatedLatex, latexThread]);
  const units = useMemo(() => Array.from(new Set((plots ?? []).map(plot => plot.unit))).sort(compareTeamName), [plots]);
  const { data: balance } = trpc.rubber.exports.teamBalance.useQuery({ unit, periodLabel }, { enabled: Boolean(unit) });
  const projectedLoss = calculateProjectedWarehouseLoss(balance?.totalImport ?? 0, balance?.totalExport ?? 0, totalExport);
  const journalPeriods = useMemo(() => Array.from(new Set((records ?? []).map(row => row.periodLabel))).sort(comparePeriodLabel), [records]);
  const filteredRecords = useMemo(() => filterTeamExportJournal(records ?? [], { unit, periodLabel: journalPeriod, fromDate, toDate }), [records, unit, journalPeriod, fromDate, toDate]);
  const create = trpc.rubber.exports.teamCreate.useMutation({ onSuccess: async () => { await Promise.all([utils.rubber.exports.teamList.invalidate(), utils.rubber.exports.teamBalance.invalidate(), utils.rubber.dashboard.invalidate(), utils.rubber.periods.invalidate()]); toast.success("Đã lưu xuất mủ theo Đội"); setFrozenContaminatedLatex(""); setLatexThread(""); setNote(""); }, onError: e => toast.error(e.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ unit, periodLabel, recordDate: new Date(`${recordDate}T12:00:00`), frozenContaminatedLatex: Number(frozenContaminatedLatex), latexThread: Number(latexThread), note }); };
  const exportJournal = async () => {
    if (!unit) return toast.error("Chọn Đội trước khi xuất Excel");
    if (!filteredRecords.length) return toast.error("Không có dữ liệu Xuất mủ trong khoảng đã chọn");
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(toTeamExportExcelRows(filteredRecords));
    XLSX.utils.book_append_sheet(workbook, sheet, "Nhật ký Xuất mủ");
    XLSX.writeFile(workbook, `nhat-ky-xuat-mu-${unit.replace(/\s+/g, "-")}-${journalPeriod.replace(/\s+/g, "-") || "tat-ca-dot"}-${fromDate || "tu-dau"}-${toDate || "den-nay"}.xlsx`);
    toast.success(`Đã xuất ${filteredRecords.length} dòng Xuất mủ của ${unit}`);
  };

  return <div className="page-enter"><PageHeader eyebrow="Xuất kho theo kỳ" title="Xuất mủ" description="Ghi nhận mủ đông tạp và mủ dây xuất kho. Cộng xuất được tự động tính để liên kết với báo cáo tiến độ." />
    {plotsError || recordsError ? <div className="mb-5"><QueryError message={plotsError?.message || recordsError?.message} /></div> : null}
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.4fr]"><Panel title="Ghi nhận xuất mủ" description="Bản ghi xuất mủ được tổng hợp theo Đội, ngày và đợt vận hành.">{!plots?.length ? <EmptyState title="Cần khai báo vườn trước" description="Hãy yêu cầu quản trị viên thêm vườn rồi quay lại ghi nhận xuất mủ." /> : <form onSubmit={submit} className="grid gap-4"><Field label="Đội"><select value={unit} onChange={e => setUnit(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Chọn đội</option>{units.map(item => <option key={item} value={item}>{item}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Ngày xuất"><Input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required /></Field><Field label="Đợt"><select value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{STANDARD_PERIODS.map(period => <option key={period} value={period}>{period}</option>)}</select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Mủ đông tạp (kg)"><Input type="number" min="0" step="0.01" value={frozenContaminatedLatex} onChange={e => setFrozenContaminatedLatex(e.target.value)} placeholder="0.00" required /></Field><Field label="Mủ dây (kg)"><Input type="number" min="0" step="0.01" value={latexThread} onChange={e => setLatexThread(e.target.value)} placeholder="0.00" required /></Field></div><div className="grid gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Calculator className="h-4 w-4" />Hao kho dự kiến</div>{!unit ? <p className="text-sm text-amber-700">Chọn Đội để tính hao kho theo số liệu nhập – xuất thực tế.</p> : <><div className="grid grid-cols-2 gap-3 text-sm"><p>Nhập cùng Đợt: <strong>{formatQuantity(balance?.totalImport ?? 0)} kg</strong></p><p>Đã xuất: <strong>{formatQuantity(balance?.totalExport ?? 0)} kg</strong></p></div><p className="font-display text-3xl font-bold text-amber-900">{formatQuantity(projectedLoss.lossKg)} <span className="text-sm">kg</span></p><p className="text-xs text-amber-700/80">Nhập cùng Đợt − cộng xuất đã ghi − bản xuất đang nhập{projectedLoss.exceedsImportKg > 0 ? ` · Xuất vượt nhập ${formatQuantity(projectedLoss.exceedsImportKg)} kg` : ""}</p></>} </div><div className="rounded-xl border border-sky-100 bg-sky-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-sky-800"><Calculator className="h-4 w-4" />Cộng xuất tự tính</div><p className="font-display mt-2 text-3xl font-bold text-sky-900">{formatQuantity(totalExport)} <span className="text-sm">kg</span></p><p className="mt-1 text-xs text-sky-700/80">Mủ đông tạp + mủ dây</p></div><Field label="Ghi chú"><Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho bản ghi (nếu có)" /></Field><Button disabled={create.isPending} className="mt-1 bg-emerald-700 hover:bg-emerald-800">{create.isPending ? "Đang lưu…" : <><Save className="mr-2 h-4 w-4" />Lưu xuất mủ</>}</Button></form>}</Panel>
      <Panel title="Nhật ký xuất mủ" description="Tra cứu và xuất báo cáo theo Đội, Đợt, khoảng thời gian."><div className="mb-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3 xl:grid-cols-5"><Field label="Đợt"><select value={journalPeriod} onChange={event => setJournalPeriod(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Tất cả Đợt</option>{journalPeriods.map(period => <option key={period} value={period}>{period}</option>)}</select></Field><Field label="Từ ngày"><Input type="date" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} /></Field><Field label="Đến ngày"><Input type="date" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} /></Field><div className="flex items-end"><Button type="button" variant="outline" className="w-full" onClick={() => { setJournalPeriod(""); setFromDate(""); setToDate(""); }}><RotateCcw className="mr-2 h-4 w-4" />Đặt lại</Button></div><div className="flex items-end"><Button type="button" className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={exportJournal}><Download className="mr-2 h-4 w-4" />Xuất Excel</Button></div></div>{isLoading ? <div className="h-56 animate-pulse rounded-xl bg-slate-100" /> : !filteredRecords.length ? <EmptyState title="Chưa có bản ghi phù hợp" description={unit || journalPeriod || fromDate || toDate ? "Hãy thay đổi Đội, Đợt hoặc khoảng ngày để tra cứu." : "Dữ liệu xuất mủ theo kỳ sẽ xuất hiện tại đây."} /> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Đội</th><th className="px-3 py-3">Đợt</th><th className="px-3 py-3 text-right">Mủ đông tạp</th><th className="px-3 py-3 text-right">Mủ dây</th><th className="px-3 py-3 text-right">Cộng xuất</th><th className="px-3 py-3">Người lập</th><th className="px-3 py-3">Ghi chú</th></tr></thead><tbody>{filteredRecords.map(row => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 text-sm text-slate-600">{formatDate(row.recordDate)}</td><td className="px-3 py-4 font-semibold text-slate-800">{row.unit}</td><td className="px-3 py-4 text-sm text-slate-600">{row.periodLabel}</td><td className="px-3 py-4 text-right text-sm">{formatQuantity(row.frozenContaminatedLatex)}</td><td className="px-3 py-4 text-right text-sm">{formatQuantity(row.latexThread)}</td><td className="px-3 py-4 text-right font-bold text-sky-700">{formatQuantity(row.totalExport)} kg</td><td className="px-3 py-4 text-sm text-slate-600">{row.preparedBy || "—"}</td><td className="max-w-48 px-3 py-4 text-sm text-slate-600">{row.note || "—"}</td></tr>)}</tbody></table></div>}</Panel></div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{children}</div>; }
