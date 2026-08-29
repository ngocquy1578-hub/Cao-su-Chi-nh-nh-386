import { describe, expect, it } from "vitest";
import { INSTALL_BANNER_DISMISS_KEY, INSTALL_MENU_LABEL, INSTALL_PAGE_PATH, INSTALL_VIDEO_URL, PWA_INSTALLED_EVENT, PWA_PROMPT_READY_EVENT, shouldShowInstallBanner } from "./installSupport";

describe("install support assets", () => {
  it("uses a stable per-device dismissal key for the install banner", () => {
    expect(INSTALL_BANNER_DISMISS_KEY).toBe("cn386-install-banner-dismissed");
  });

  it("references the uploaded 30-second installation tutorial", () => {
    expect(INSTALL_VIDEO_URL).toMatch(/^\/manus-storage\//);
    expect(INSTALL_VIDEO_URL).toMatch(/\.mp4$/);
  });

  it("keeps the installation menu target stable", () => {
    expect(INSTALL_MENU_LABEL).toBe("Cài ứng dụng");
    expect(INSTALL_PAGE_PATH).toBe("/install");
  });

  it("shows the first-visit banner only for a non-installed device that has not dismissed it", () => {
    expect(shouldShowInstallBanner(false, null)).toBe(true);
    expect(shouldShowInstallBanner(false, "1")).toBe(false);
    expect(shouldShowInstallBanner(true, null)).toBe(false);
  });

  it("uses stable browser events to receive the install prompt and hide the banner after installation", () => {
    expect(PWA_PROMPT_READY_EVENT).toBe("cn386-pwa-prompt-ready");
    expect(PWA_INSTALLED_EVENT).toBe("appinstalled");
  });
});
