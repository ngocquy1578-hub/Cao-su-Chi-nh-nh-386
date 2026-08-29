import { Button } from "@/components/ui/button";
import { INSTALL_BANNER_DISMISS_KEY, PWA_INSTALLED_EVENT, PWA_PROMPT_READY_EVENT, DeferredInstallPrompt, getDeferredInstallPrompt, markInstallBannerDismissed, shouldShowInstallBanner } from "@/lib/installSupport";
import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function InstallAppBanner() {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);

  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setVisible(shouldShowInstallBanner(installed, localStorage.getItem(INSTALL_BANNER_DISMISS_KEY)));
    setDeferredPrompt(getDeferredInstallPrompt());
    const onPromptReady = () => setDeferredPrompt(getDeferredInstallPrompt());
    const onInstalled = () => { markInstallBannerDismissed(); setDeferredPrompt(null); setVisible(false); };
    window.addEventListener(PWA_PROMPT_READY_EVENT, onPromptReady);
    window.addEventListener(PWA_INSTALLED_EVENT, onInstalled);
    return () => { window.removeEventListener(PWA_PROMPT_READY_EVENT, onPromptReady); window.removeEventListener(PWA_INSTALLED_EVENT, onInstalled); };
  }, []);

  if (!visible) return null;
  const dismiss = () => {
    markInstallBannerDismissed();
    setVisible(false);
  };
  const install = async () => {
    if (!deferredPrompt) { setLocation("/install"); return; }
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") { markInstallBannerDismissed(); setVisible(false); }
    setDeferredPrompt(null);
  };

  return <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 px-3 py-3 shadow-sm sm:mb-6 sm:px-4">
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white"><Smartphone className="h-4 w-4" /></div>
    <div className="min-w-0 flex-1"><p className="text-sm font-bold text-emerald-950">Cài Cao su CN386 lên điện thoại</p><p className="mt-0.5 text-xs leading-4 text-emerald-800">Mở nhanh từ màn hình chính, như một ứng dụng riêng.</p></div>
    <Button size="sm" className="h-9 shrink-0 bg-emerald-700 px-3 hover:bg-emerald-800" onClick={install}><Download className="mr-1.5 h-4 w-4" />Cài đặt</Button>
    <button onClick={dismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-emerald-800 hover:bg-emerald-100" aria-label="Đóng gợi ý cài ứng dụng"><X className="h-4 w-4" /></button>
  </div>;
}
