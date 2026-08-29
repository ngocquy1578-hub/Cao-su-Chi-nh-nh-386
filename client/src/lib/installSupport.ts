export const INSTALL_BANNER_DISMISS_KEY = "cn386-install-banner-dismissed";
export const INSTALL_VIDEO_URL = "/manus-storage/huong-dan-cai-cao-su-cn386-30s_33d1fc92.mp4";
export const INSTALL_PAGE_PATH = "/install";
export const INSTALL_MENU_LABEL = "Cài ứng dụng";
export const PWA_INSTALLED_EVENT = "appinstalled";
export const PWA_PROMPT_READY_EVENT = "cn386-pwa-prompt-ready";

export type DeferredInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type PwaWindow = Window & { __cn386DeferredPrompt?: DeferredInstallPrompt | null };

export function shouldShowInstallBanner(isStandalone: boolean, dismissedValue: string | null) {
  return !isStandalone && dismissedValue !== "1";
}

export function markInstallBannerDismissed() {
  localStorage.setItem(INSTALL_BANNER_DISMISS_KEY, "1");
}

export function getDeferredInstallPrompt() { return (window as PwaWindow).__cn386DeferredPrompt ?? null; }

export function startPwaInstallListener() {
  const pwaWindow = window as PwaWindow;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    pwaWindow.__cn386DeferredPrompt = event as DeferredInstallPrompt;
    window.dispatchEvent(new Event(PWA_PROMPT_READY_EVENT));
  });
  window.addEventListener(PWA_INSTALLED_EVENT, () => { pwaWindow.__cn386DeferredPrompt = null; markInstallBannerDismissed(); });
}
