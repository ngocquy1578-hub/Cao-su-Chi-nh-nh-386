import { EmptyState, PageHeader, Panel } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { comparePlotsByYearAndName } from "@/lib/plotOrder";
import { formatDate, toDateInput } from "@/lib/rubber";
import { trpc } from "@/lib/trpc";
import { compareTeamName } from "@shared/teamOrder";
import { ClipboardCheck, Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function CarePage() {
  const utils = trpc.useUtils();
  const { data: plots, error: plotsError } = trpc.rubber.plots.list.useQuery();
  const { data: activities, isLoading, error: activitiesError } = trpc.rubber.care.list.useQuery();
  const [plotId, setPlotId] = useState("");
  const [activityDate, setActivityDate] = useState(toDateInput());
  const [description, setDescription] = useState("");
  const create = trpc.rubber.care.create.useMutation({ onSuccess: async () => { await utils.rubber.care.list.invalidate(); toast.success("Đã lưu nhật ký chăm sóc"); setDescription(""); }, onError: error => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ plotId: Number(plotId), activityDate: new Date(`${activityDate}T12:00:00`), description }); };

  return <div className="page-enter"><PageHeader eyebrow="Nhật ký hiện trường" title="Chăm sóc" description="Theo dõi từng hoạt động chăm sóc để duy trì lịch sử vận hành rõ ràng cho mỗi vườn." />
    {plotsError || activitiesError ? <div className="mb-5"><QueryError message={plotsError?.message || activitiesError?.message} /></div> : null}
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]"><Panel title="Thêm hoạt động chăm sóc" description="Ghi nhận đầy đủ ngày thực hiện và nội dung công việc.">{!plots?.length ? <EmptyState title="Cần khai báo vườn trước" description="Dữ liệu chăm sóc được gắn với từng vườn đã khai báo." /> : <form onSubmit={submit} className="grid gap-4"><Field label="Vườn"><select value={plotId} onChange={e => setPlotId(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Chọn vườn</option>{[...plots].sort((left, right) => compareTeamName(left.unit, right.unit) || comparePlotsByYearAndName(left, right)).map(plot => <option key={plot.id} value={plot.id}>{plot.code} — {plot.name}</option>)}</select></Field><Field label="Ngày thực hiện"><Input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} required /></Field><Field label="Mô tả công việc"><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="VD: Bón phân, phát quang, kiểm tra sâu bệnh…" className="min-h-32" required /></Field><Button disabled={create.isPending} className="bg-emerald-700 hover:bg-emerald-800">{create.isPending ? "Đang lưu…" : <><Save className="mr-2 h-4 w-4" />Lưu chăm sóc</>}</Button></form>}</Panel>
      <Panel title="Lịch sử chăm sóc" description="Các hoạt động được sắp xếp theo thời gian mới nhất.">{isLoading ? <div className="h-56 animate-pulse rounded-xl bg-slate-100" /> : !activities?.length ? <EmptyState title="Chưa có hoạt động chăm sóc" description="Nhật ký hiện trường sẽ xuất hiện tại đây khi có bản ghi." /> : <div className="space-y-3">{activities.map(item => <article key={item.id} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/55 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ClipboardCheck className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-800">{item.plotCode} — {item.plotName}</p><time className="text-xs font-medium text-slate-400">{formatDate(item.activityDate)}</time></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p><p className="mt-2 text-xs font-semibold text-emerald-700">{item.unit}</p></div></article>)}</div>}</Panel></div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label className="text-sm font-semibold text-slate-700">{label}</Label>{children}</div>; }
