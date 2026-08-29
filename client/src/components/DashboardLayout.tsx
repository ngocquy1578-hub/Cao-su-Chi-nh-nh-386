import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InternalLogin } from "@/components/InternalLogin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { INSTALL_MENU_LABEL, INSTALL_PAGE_PATH } from "@/lib/installSupport";
import { BarChart3, ClipboardList, Download, FileSpreadsheet, Inbox, LayoutDashboard, Leaf, LogOut, MapPinned, Send, UsersRound, Warehouse, TrendingUp, ShieldCheck, ScrollText, TableProperties } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { InstallAppBanner } from "./InstallAppBanner";

const menuGroups = [
  { label: "Điều hành", items: [
    { icon: LayoutDashboard, label: "Tổng quan", path: "/" },
    { icon: MapPinned, label: "Vườn", path: "/plots" },
    { icon: Inbox, label: "Nhập mủ", path: "/imports" },
    { icon: Send, label: "Xuất mủ", path: "/exports" },
    { icon: ClipboardList, label: "Khai thác & chăm sóc", path: "/care-operations" },
    { icon: UsersRound, label: "Quản lý & Nhân công", path: "/workforce" },
  ] },
  { label: "Báo cáo", items: [
    { icon: BarChart3, label: "Báo cáo tiến độ", path: "/reports" },
    { icon: Warehouse, label: "Hao hụt kho", path: "/warehouse-loss" },
    { icon: TrendingUp, label: "Báo cáo tăng giảm", path: "/production-change" },
    { icon: TableProperties, label: "Sản lượng theo lô", path: "/plot-production" },
  ] },
  { label: "Hệ thống", items: [
    { icon: FileSpreadsheet, label: "Import & Excel", path: "/data-tools" },
    { icon: Download, label: INSTALL_MENU_LABEL, path: INSTALL_PAGE_PATH },
    { icon: ShieldCheck, label: "Tài khoản & quyền", path: "/accounts", adminOnly: true },
    { icon: ScrollText, label: "Nhật ký hoạt động", path: "/activity-log", adminOnly: true },
  ] },
];

const SIDEBAR_WIDTH_KEY = "rubber-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 208;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f8f4] p-5">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-lime-100 blur-3xl" />
        <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_30px_70px_-35px_rgba(15,67,48,0.35)] backdrop-blur">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-800/20"><Leaf className="h-6 w-6" /></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Cao su CN386</p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-950">Không gian vận hành nội bộ</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Đăng nhập bằng tên đăng nhập và mật khẩu được admin cấp để truy cập dữ liệu nội bộ.</p>
          <div className="mt-7"><InternalLogin /></div>
          <button onClick={() => startLogin()} className="mt-4 text-xs font-semibold text-emerald-700 hover:underline">Quản trị viên Manus đăng nhập tại đây</button>
        </div>
      </div>
    );
  }

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const visibleGroups = menuGroups.map(group => ({ ...group, items: group.items.filter(item => !item.adminOnly || user?.role === "admin") })).filter(group => group.items.length);
  const visibleItems = visibleGroups.flatMap(group => group.items);
  const activeItem = visibleItems.find(item => item.path === location);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-emerald-950/10 bg-[#0d2f25] text-emerald-50">
          <SidebarHeader className="h-[76px] justify-center border-b border-white/10 px-3">
            <div className="flex items-center gap-3 px-1">
              <button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-lime-200 text-emerald-950 shadow-lg shadow-black/15 transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" aria-label="Thu gọn điều hướng"><Leaf className="h-5 w-5" /></button>
              {!isCollapsed ? <div className="min-w-0"><p className="truncate font-display text-sm font-extrabold tracking-tight text-white">Cao su <span className="text-emerald-300">386</span></p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Plantation console</p></div> : null}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-3">
            {visibleGroups.map((group, groupIndex) => <div key={group.label} className={groupIndex ? "mt-4 border-t border-white/10 pt-3" : ""}>
              {!isCollapsed ? <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/65">{group.label}</p> : null}
              <SidebarMenu>{group.items.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-9 rounded-lg px-3 text-[13px] font-medium text-emerald-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:shadow-sm"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
            </div>)}
          </SidebarContent>
          <SidebarFooter className="border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 shrink-0 border border-emerald-300/25"><AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-900">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-white">{user?.name || "Người dùng"}</p><p className="mt-0.5 truncate text-[10px] text-emerald-200/70">{user?.role === "admin" ? "Quản trị viên" : "Người dùng"}</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Đăng xuất</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed ? <div className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-emerald-400/40" onMouseDown={() => setIsResizing(true)} /> : null}
      </div>
      <SidebarInset className="min-w-0 bg-[#f6f8f4]">
        {isMobile ? <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-[#f6f8f4]/95 px-3 shadow-sm backdrop-blur"><SidebarTrigger className="rounded-xl bg-white shadow-sm" /><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Cao su CN386</p><p className="truncate text-sm font-semibold text-slate-900">{activeItem?.label || "Tổng quan"}</p></div></div> : null}
        <main className="min-h-screen p-3 pb-8 sm:p-4 md:p-8 lg:p-10"><InstallAppBanner />{children}</main>
      </SidebarInset>
    </>
  );
}
