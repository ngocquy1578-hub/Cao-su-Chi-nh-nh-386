import { TriangleAlert } from "lucide-react";

export function QueryError({ title = "Không thể tải dữ liệu", message }: { title?: string; message?: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-900"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700"><TriangleAlert className="h-4 w-4" /></div><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-sm leading-5 text-red-700">{message || "Vui lòng thử tải lại trang hoặc liên hệ quản trị viên nếu lỗi tiếp diễn."}</p></div></div>;
}
