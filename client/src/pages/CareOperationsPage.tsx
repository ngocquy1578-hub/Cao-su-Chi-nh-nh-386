import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateCareCompletionPercent } from "@/lib/careProgress";
import { buildCareDailyExportRows, careDailyExportMeta } from "@/lib/careDailyExport";
import { filterCareRecordsByDateRange } from "@/lib/careDateRange";
import { buildCareWorkbookSheets } from "@/lib/careWorkbook";
import { filterGardenOptions } from "@/lib/gardenSearch";
import { readLastSelectedCareTeam, writeLastSelectedCareTeam } from "@/lib/lastSelectedTeam";
import { comparePlotsByYearAndName } from "@/lib/plotOrder";
import { formatPercent, formatQuantity } from "@/lib/rubber";
import { trpc } from "@/lib/trpc";
import { compareTeamName } from "@shared/teamOrder";
import { Download, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Category = "tapping" | "reinforcement" | "care" | "treatment";
type CareForm = { date: string; unit: string; gardenName: string; plan: string; actual: string; cumulative: string; pending: string; partial: string; nextGarden: string; workContent: string; note: string };

const config: Record<Category, { label: string; metric: string; description: string }> = {
  tapping: { label: "Theo dõi cạo mủ", metric: "Vườn", description: "Theo dõi vườn cạo, tình trạng cạo và tiến độ hoàn thành." },
  reinforcement: { label: "Gia cố keo, máng, tấm che", metric: "Vườn", description: "Ghi nhận kế hoạch, thực hiện và lũy kế gia cố." },
  care: { label: "Chăm sóc", metric: "Ha", description: "Chặt chồi thân gỗ, làm cỏ và băm chồi." },
  treatment: { label: "Phun, bôi thuốc", metric: "Ha", description: "Theo dõi diện tích phun thuốc, bôi thuốc theo ngày." },
};
const categories = Object.keys(config) as Category[];
const num = (value: string) => Number(value) || 0;
const blankForm = (): CareForm => ({ date: new Date().toISOString().slice(0, 10), unit: "", gardenName: "", plan: "", actual: "", cumulative: "", pending: "", partial: "", nextGarden: "", workContent: "", note: "" });

export default function CareOperationsPage() {
  const [category, setCategory] = useState<Category>("tapping");
  const [form, setForm] = useState<CareForm>(() => ({ ...blankForm(), unit: readLastSelectedCareTeam(window.localStorage) }));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [gardenSearch, setGardenSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: records = [], isLoading } = trpc.operations.list.useQuery({ category });
  const { data: allRecords = [] } = trpc.operations.list.useQuery();
  const { data: plots = [] } = trpc.rubber.plots.list.useQuery();
  const isTapping = category === "tapping";
  const needsWorkContent = category === "care" || category === "treatment";
  const completionPercent = calculateCareCompletionPercent(form.plan, form.actual);
  const teamOptions = useMemo(() => Array.from(new Set(plots.map(plot => plot.unit))).sort(compareTeamName), [plots]);
  const gardenOptions = useMemo(() => plots.filter(plot => plot.unit === form.unit).sort(comparePlotsByYearAndName), [plots, form.unit]);
  const filteredGardenOptions = useMemo(() => filterGardenOptions(gardenOptions, gardenSearch), [gardenOptions, gardenSearch]);
  useEffect(() => {
    if (form.gardenName && !gardenOptions.some(plot => plot.name === form.gardenName)) update("gardenName", "");
  }, [form.gardenName, gardenOptions]);
  useEffect(() => {
    if (!form.unit || !teamOptions.length || teamOptions.includes(form.unit)) return;
    setForm(current => ({ ...current, unit: "", gardenName: "" }));
    writeLastSelectedCareTeam("", window.localStorage);
  }, [form.unit, teamOptions]);
  const save = trpc.operations.save.useMutation({
    onSuccess: async () => { await utils.operations.list.invalidate(); toast.success(`Đã lưu ${config[category].label.toLowerCase()}`); setForm(value => ({ ...value, actual: "", note: "" })); },
    onError: error => toast.error(error.message),
  });
  const update = (key: keyof CareForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.unit || (isTapping && !form.gardenName) || (needsWorkContent && !form.workContent)) return toast.error(isTapping ? "Vui lòng nhập đội và vườn" : needsWorkContent ? "Vui lòng nhập đội và nội dung công việc" : "Vui lòng nhập đội");
    save.mutate({
      category,
      activityDate: new Date(`${form.date}T00:00:00.000Z`),
      unit: form.unit,
      gardenName: isTapping ? form.gardenName : config[category].label,
      areaHa: null,
      tappingSection: null,
      planQuantity: num(form.plan),
      actualQuantity: num(form.actual),
      cumulativeQuantity: isTapping ? num(form.actual) : form.cumulative ? num(form.cumulative) : num(form.actual),
      metricUnit: config[category].metric,
      completedGardens: null,
      pendingGardens: isTapping && form.pending ? num(form.pending) : null,
      partialGardens: isTapping && form.partial ? num(form.partial) : null,
      nextGarden: isTapping ? form.nextGarden || null : null,
      workContent: needsWorkContent ? form.workContent || null : null,
      note: form.note || null,
    });
  };
  const exportWorkbook = async () => {
    const XLSX = await import("xlsx"); const book = XLSX.utils.book_new();
    buildCareWorkbookSheets(allRecords).forEach(group => { const sheet = XLSX.utils.json_to_sheet(group.rows.map(row => ({ Ngày: row.activityDate, Đội: row.unit, Vườn: row.gardenName ?? "", "Diện tích (ha)": row.areaHa ?? "", "Phần cạo": row.tappingSection ?? "", "Nội dung": row.workContent ?? "", KH: row.planQuantity, TH: row.actualQuantity, "Lũy kế": row.cumulativeQuantity, "Đơn vị tính": row.metricUnit, "% hoàn thành": Number(Number(row.progressPercent ?? 0).toFixed(2)), "Chưa cạo": row.pendingGardens ?? "", "Cạo chưa xong": row.partialGardens ?? "", "Cạo tiếp vườn": row.nextGarden ?? "", "Ghi chú": row.note ?? "" }))); XLSX.utils.book_append_sheet(book, sheet, group.name.slice(0, 31)); });
    if (!book.SheetNames.length) return toast.error("Chưa có dữ liệu chăm sóc để xuất Excel"); XLSX.writeFile(book, "tong-hop-cham-soc-cao-su.xlsx");
  };
  const exportCurrentBoard = async () => {
    if (!orderedRecords.length) return toast.error(`Không có dữ liệu ${config[category].label.toLowerCase()} trong khoảng thời gian đã chọn`);
    const XLSX = await import("xlsx"); const book = XLSX.utils.book_new(); const meta = careDailyExportMeta[category];
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(buildCareDailyExportRows(category, orderedRecords)), meta.sheetName.slice(0, 31));
    XLSX.writeFile(book, meta.fileName); toast.success(`Đã xuất Excel ${config[category].label.toLowerCase()}`);
  };
  const filteredRecords = useMemo(() => filterCareRecordsByDateRange(records, fromDate || undefined, toDate || undefined), [records, fromDate, toDate]);
  const totals = useMemo(() => ({ plan: filteredRecords.reduce((sum, row) => sum + row.planQuantity, 0), actual: filteredRecords.reduce((sum, row) => sum + row.actualQuantity, 0) }), [filteredRecords]);
  const orderedRecords = useMemo(() => [...filteredRecords].sort((left, right) => new Date(right.activityDate).getTime() - new Date(left.activityDate).getTime() || compareTeamName(left.unit, right.unit)), [filteredRecords]);
  const actualLabel = isTapping ? "Cạo xong (Vườn)" : `TH (${config[category].metric})`;

  return <div className="page-enter">
    <PageHeader eyebrow="Vận hành vườn" title="Khai thác & chăm sóc hằng ngày" description="Bốn bảng theo mẫu: cạo mủ; gia cố keo, máng, tấm che; chăm sóc; phun, bôi thuốc." action={<Button variant="outline" className="bg-white" onClick={exportWorkbook}><Download className="mr-2 h-4 w-4" />Xuất tổng hợp Excel</Button>} />
    <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Nhập dữ liệu hằng ngày" description={config[category].description}>
        <div className="grid gap-3">
          <Field label="Bảng theo dõi"><Select value={category} onValueChange={value => { setCategory(value as Category); setForm(blankForm()); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(key => <SelectItem key={key} value={key}>{config[key].label}</SelectItem>)}</SelectContent></Select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Ngày"><Input type="date" value={form.date} onChange={e => update("date", e.target.value)} /></Field><Field label="Đội"><select value={form.unit} onChange={e => { const team = e.target.value; update("unit", team); update("gardenName", ""); setGardenSearch(""); writeLastSelectedCareTeam(team, window.localStorage); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">{teamOptions.length ? "Chọn Đội" : "Chưa có Đội trong phạm vi"}</option>{teamOptions.map(team => <option key={team} value={team}>{team}</option>)}</select></Field></div>
          {isTapping ? <><Field label="Tìm nhanh Lô"><Input type="search" value={gardenSearch} onChange={e => { setGardenSearch(e.target.value); update("gardenName", ""); }} disabled={!form.unit} placeholder={form.unit ? "Nhập tên Lô hoặc năm trồng" : "Chọn Đội trước"} /></Field>{form.unit ? <p className="-mt-1 text-xs text-slate-500">{gardenSearch.trim() ? `Tìm thấy ${filteredGardenOptions.length}/${gardenOptions.length} Lô` : `Có ${gardenOptions.length} Lô thuộc ${form.unit}`}</p> : null}<Field label="Vườn"><select value={form.gardenName} onChange={e => update("gardenName", e.target.value)} disabled={!form.unit} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"><option value="">{!form.unit ? "Chọn Đội trước" : !gardenOptions.length ? "Chưa có Vườn/Lô thuộc Đội" : !filteredGardenOptions.length ? "Không tìm thấy Lô" : "Chọn Vườn/Lô"}</option>{filteredGardenOptions.map(plot => <option key={plot.id} value={plot.name}>{plot.name}{plot.plantedYear ? ` (${plot.plantedYear})` : ""}</option>)}</select></Field></> : null}
          {needsWorkContent ? <Field label="Nội dung công việc"><Input value={form.workContent} onChange={e => update("workContent", e.target.value)} placeholder={category === "care" ? "Ví dụ: Chặt chồi thân gỗ" : "Ví dụ: Phun thuốc"} /></Field> : null}
          <div className="grid grid-cols-2 gap-3"><Field label={`KH (${config[category].metric})`}><Input inputMode="decimal" value={form.plan} onChange={e => update("plan", e.target.value)} /></Field><Field label={actualLabel}><Input inputMode="decimal" value={form.actual} onChange={e => update("actual", e.target.value)} /></Field>{!isTapping ? <Field label={`Lũy kế (${config[category].metric})`}><Input inputMode="decimal" value={form.cumulative} onChange={e => update("cumulative", e.target.value)} /></Field> : null}<Field label="% hoàn thành"><Input value={`${completionPercent}%`} disabled /></Field></div>
          {isTapping ? <><div className="grid grid-cols-2 gap-3"><Field label="Chưa cạo"><Input inputMode="numeric" value={form.pending} onChange={e => update("pending", e.target.value)} /></Field><Field label="Cạo chưa xong"><Input inputMode="numeric" value={form.partial} onChange={e => update("partial", e.target.value)} /></Field></div><Field label="Cạo tiếp vườn"><Input value={form.nextGarden} onChange={e => update("nextGarden", e.target.value)} placeholder="Tên vườn tiếp theo" /></Field></> : null}
          <Field label="Ghi chú"><Textarea value={form.note} onChange={e => update("note", e.target.value)} placeholder="Khó khăn hoặc kiến nghị" /></Field>
          <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={submit} disabled={save.isPending}><Save className="mr-2 h-4 w-4" />{save.isPending ? "Đang lưu…" : "Lưu dữ liệu hằng ngày"}</Button>
        </div>
      </Panel>
      <Panel title={config[category].label} description={`KH ${formatQuantity(totals.plan)} · TH ${formatQuantity(totals.actual)} ${config[category].metric}`}><div className="mb-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"><Field label="Từ ngày"><Input type="date" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} /></Field><Field label="Đến ngày"><Input type="date" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} /></Field><Button type="button" variant="outline" className="self-end" disabled={!fromDate && !toDate} onClick={() => { setFromDate(""); setToDate(""); }}>Đặt lại</Button><Button type="button" variant="outline" className="self-end" onClick={exportCurrentBoard}><Download className="mr-2 h-4 w-4" />Xuất Excel bảng này</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Ngày</th><th className="p-3">Đội / Vườn</th><th className="p-3 text-right">KH</th><th className="p-3 text-right">TH</th><th className="p-3 text-right">Lũy kế</th><th className="p-3 text-right">Tiến độ</th></tr></thead><tbody>{orderedRecords.map(row => <tr key={row.id} className="border-b border-slate-100"><td className="p-3">{new Date(row.activityDate).toLocaleDateString("vi-VN")}</td><td className="p-3"><b>{row.unit}</b><span className="block text-xs text-slate-500">{row.gardenName}{(category === "care" || category === "treatment") && row.workContent ? ` · ${row.workContent}` : ""}</span></td><td className="p-3 text-right">{formatQuantity(row.planQuantity)}</td><td className="p-3 text-right">{formatQuantity(row.actualQuantity)}</td><td className="p-3 text-right">{formatQuantity(row.cumulativeQuantity)}</td><td className="p-3 text-right font-semibold text-emerald-700">{formatPercent(row.progressPercent)}</td></tr>)}</tbody></table></div>{!records.length && !isLoading ? <p className="py-12 text-center text-sm text-slate-500">Chưa có dữ liệu cho bảng này.</p> : records.length && !orderedRecords.length ? <p className="py-12 text-center text-sm text-slate-500">Không có dữ liệu trong khoảng thời gian đã chọn.</p> : null}</Panel>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>; }
