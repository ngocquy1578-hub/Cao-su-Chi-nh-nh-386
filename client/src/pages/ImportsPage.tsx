import { EmptyState, PageHeader, Panel } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PERIOD, STANDARD_PERIODS, formatDate, formatQuantity, toDateInput } from "@/lib/rubber";
import { trpc } from "@/lib/trpc";
import { comparePlotsByTeamYearAndName } from "@/lib/plotOrder";
import { compareTeamName } from "@shared/teamOrder";
import { Calculator, Inbox, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ImportsPage() {
  const utils = trpc.useUtils();
  const { data: plots, error: plotsError } = trpc.rubber.plots.list.useQuery();
  const { data: records, isLoading, error: recordsError } = trpc.rubber.imports.list.useQuery();
  const [plotId, setPlotId] = useState("");
  const [unit, setUnit] = useState("");
  const [periodLabel, setPeriodLabel] = useState<string>(DEFAULT_PERIOD);
  const [recordDate, setRecordDate] = useState(toDateInput());
  const [frozenLatex, setFrozenLatex] = useState("");
  const [latexThread, setLatexThread] = useState("");
  const [note, setNote] = useState("");
  const totalImport = useMemo(() => Number(frozenLatex || 0) + Number(latexThread || 0), [frozenLatex, latexThread]);
  const units = useMemo(() => Array.from(new Set((plots ?? []).map(plot => plot.unit))).sort(compareTeamName), [plots]);
  const selectablePlots = useMemo(() => (plots ?? []).filter(plot => !unit || plot.unit === unit).sort(comparePlotsByTeamYearAndName), [plots, unit]);
  const save = trpc.rubber.imports.save.useMutation({ onSuccess: async () => { await Promise.all([utils.rubber.imports.list.invalidate(), utils.rubber.dashboard.invalidate(), utils.rubber.periods.invalidate()]); toast.success("Đã lưu nhập mủ"); setFrozenLatex(""); setLatexThread(""); setNote(""); }, onError: e => toast.error(e.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate({ plotId: Number(plotId), periodLabel, recordDate: new Date(`${recordDate}T12:00:00`), frozenLatex: Number(frozenLatex), latexThread: Number(latexThread), note }); };

  return <div className="page-enter"><PageHeader eyebrow="Sản lượng hằng ngày" title="Nhập mủ" description="Ghi nhận mủ đông và mủ dây theo từng ngày, từng vườn. Cộng nhập được tự động tính và lưu theo đợt." />
    {plotsError || recordsError ? <div className="mb-5"><QueryError message={plotsError?.message || recordsError?.message} /></div> : null}
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.4fr]"><Panel title="Ghi nhận nhập mủ" description="Chọn Đội trước, sau đó chọn lô/vườn. Một lô có tối đa một bản ghi cho mỗi ngày.">{!plots?.length ? <EmptyState title="Cần khai báo vườn trước" description="Hãy yêu cầu quản trị viên thêm vườn rồi quay lại ghi nhận nhập mủ." /> : <form onSubmit={submit} className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Đội"><select value={unit} onChange={e => { setUnit(e.target.value); setPlotId(""); }} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Chọn đội</option>{units.map(item => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="Vườn / Lô"><select value={plotId} onChange={e => setPlotId(e.target.value)} required disabled={!unit} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"><option value="">{unit ? "Chọn vườn/lô" : "Chọn đội trước"}</option>{selectablePlots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}</option>)}</select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Ngày nhập"><Input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required /></Field><Field label="Đợt"><select value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{STANDARD_PERIODS.map(period => <option key={period} value={period}>{period}</option>)}</select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Mủ đông (kg)"><Input type="number" min="0" step="0.01" value={frozenLatex} onChange={e => setFrozenLatex(e.target.value)} placeholder="0.00" required /></Field><Field label="Mủ dây (kg)"><Input type="number" min="0" step="0.01" value={latexThread} onChange={e => setLatexThread(e.target.value)} placeholder="0.00" required /></Field></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Calculator className="h-4 w-4" />Cộng nhập tự tính</div><p className="font-display mt-2 text-3xl font-bold text-emerald-900">{formatQuantity(totalImport)} <span className="text-sm">kg</span></p><p className="mt-1 text-xs text-emerald-700/80">Cộng mủ đông + mủ dây</p></div><Field label="Ghi chú"><Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho bản ghi (nếu có)" /></Field><Button disabled={save.isPending} className="mt-1 bg-emerald-700 hover:bg-emerald-800">{save.isPending ? "Đang lưu…" : <><Save className="mr-2 h-4 w-4" />Lưu nhập mủ</>}</Button></form>}</Panel>
      <Panel title="Nhật ký nhập mủ" description="Các bản ghi mới nhất, hiển thị cộng nhập đã được tự động tổng hợp.">{isLoading ? <div className="h-56 animate-pulse rounded-xl bg-slate-100" /> : !records?.length ? <EmptyState title="Chưa có bản ghi nhập mủ" description="Dữ liệu nhập mủ hằng ngày sẽ xuất hiện tại đây." /> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Vườn / đơn vị</th><th className="px-3 py-3">Đợt</th><th className="px-3 py-3 text-right">Mủ đông</th><th className="px-3 py-3 text-right">Mủ dây</th><th className="px-3 py-3 text-right">Cộng nhập</th></tr></thead><tbody>{records.map(row => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4 text-sm text-slate-600">{formatDate(row.recordDate)}</td><td className="px-3 py-4"><p className="font-semibold text-slate-800">{row.plotCode} — {row.plotName}</p><p className="mt-0.5 text-xs text-slate-400">{row.unit}</p></td><td className="px-3 py-4 text-sm text-slate-600">{row.periodLabel}</td><td className="px-3 py-4 text-right text-sm">{formatQuantity(row.frozenLatex)}</td><td className="px-3 py-4 text-right text-sm">{formatQuantity(row.latexThread)}</td><td className="px-3 py-4 text-right font-bold text-emerald-700">{formatQuantity(row.totalImport)} kg</td></tr>)}</tbody></table></div>}</Panel></div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{children}</div>; }
