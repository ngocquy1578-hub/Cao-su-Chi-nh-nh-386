import { Button } from "@/components/ui/button";
import { INSTALL_VIDEO_URL, PWA_INSTALLED_EVENT, PWA_PROMPT_READY_EVENT, DeferredInstallPrompt, getDeferredInstallPrompt, markInstallBannerDismissed } from "@/lib/installSupport";
import { CheckCircle2, Download, Leaf, PlayCircle, QrCode, Share2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export default function InstallAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(isAppleMobile());
    setDeferredPrompt(getDeferredInstallPrompt());
    const onPromptReady = () => setDeferredPrompt(getDeferredInstallPrompt());
    const onInstalled = () => {
      markInstallBannerDismissed();
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener(PWA_PROMPT_READY_EVENT, onPromptReady);
    window.addEventListener(PWA_INSTALLED_EVENT, onInstalled);
    return () => {
      window.removeEventListener(PWA_PROMPT_READY_EVENT, onPromptReady);
      window.removeEventListener(PWA_INSTALLED_EVENT, onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      setShowManual(true);
      return;
    }
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") { markInstallBannerDismissed(); setInstalled(true); }
    setDeferredPrompt(null);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.origin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <main className="min-h-screen bg-[#f6f8f4] px-4 py-8 sm:grid sm:place-items-center sm:p-8">
    <section className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_80px_-42px_rgba(15,67,48,0.42)]">
      <div className="relative overflow-hidden bg-[#0d2f25] px-6 pb-8 pt-7 text-white sm:px-8">
        <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border border-emerald-300/20" />
        <div className="relative flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-lime-200 text-emerald-950"><Leaf className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Cao su CN386</p><p className="mt-1 text-sm font-semibold text-white/80">Plantation console</p></div></div>
        <div className="relative mt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Ứng dụng di động</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Cài vào điện thoại</h1><p className="mt-2 max-w-sm text-sm leading-6 text-emerald-50/80">Mở hệ thống như một ứng dụng riêng, có biểu tượng Cao su CN386 trên màn hình chính.</p></div>
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        {installed ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-semibold">Ứng dụng đã được cài</p><p className="mt-1 text-sm leading-5 text-emerald-800">Bạn có thể mở Cao su CN386 từ biểu tượng trên màn hình chính. Hộp gợi ý cài đặt sẽ không hiện lại.</p></div></div> : <><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-semibold text-slate-900">Cài đặt ứng dụng</p><p className="mt-1 text-sm leading-5 text-slate-600">Android sẽ hiện hộp cài đặt khi trình duyệt đủ điều kiện. Trên iPhone, hãy dùng nút Chia sẻ của Safari.</p></div></div></div><Button className="h-12 w-full bg-emerald-700 text-base hover:bg-emerald-800" onClick={install}><Download className="mr-2 h-5 w-5" />Cài đặt Cao su CN386</Button></>}
        {(showManual || ios || !deferredPrompt) && !installed ? <div className="space-y-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"><p className="font-semibold text-slate-900">Cài thủ công nếu chưa thấy nút cài đặt</p><div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold">Android (Chrome)</p><p className="mt-1 leading-5">Mở menu ⋮ của Chrome → chọn <b>“Cài đặt ứng dụng”</b> hoặc <b>“Thêm vào Màn hình chính”</b>.</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1 font-semibold">iPhone / iPad (Safari) <Share2 className="h-4 w-4" /></p><p className="mt-1 leading-5">Chọn biểu tượng <b>Chia sẻ</b> → <b>“Thêm vào Màn hình chính”</b> → <b>Thêm</b>.</p></div></div> : null}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white"><PlayCircle className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-emerald-950">Video hướng dẫn 30 giây</p><p className="mt-0.5 text-xs leading-5 text-emerald-800">Xem nhanh cách cài trên Android hoặc iPhone.</p></div><a href={INSTALL_VIDEO_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">Xem video</a></div>
        <div className="flex flex-col gap-2 sm:flex-row"><a href="/" className="flex-1"><Button variant="outline" className="h-11 w-full">Mở hệ thống</Button></a><Button variant="ghost" className="h-11" onClick={copyLink}><QrCode className="mr-2 h-4 w-4" />{copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}</Button></div>
      </div>
    </section>
  </main>;
}
