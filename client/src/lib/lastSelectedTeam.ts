export const LAST_SELECTED_CARE_TEAM_KEY = "cao-su-cn386:last-selected-care-team";

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readLastSelectedCareTeam(storage?: BrowserStorage | null) {
  try {
    return storage?.getItem(LAST_SELECTED_CARE_TEAM_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeLastSelectedCareTeam(team: string, storage?: BrowserStorage | null) {
  try {
    if (team.trim()) storage?.setItem(LAST_SELECTED_CARE_TEAM_KEY, team);
    else storage?.removeItem(LAST_SELECTED_CARE_TEAM_KEY);
  } catch {
    // Không chặn thao tác nhập liệu khi trình duyệt không cho phép lưu cục bộ.
  }
}
