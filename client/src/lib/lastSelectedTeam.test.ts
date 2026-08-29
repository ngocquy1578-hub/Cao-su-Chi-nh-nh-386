import { describe, expect, it } from "vitest";
import { LAST_SELECTED_CARE_TEAM_KEY, readLastSelectedCareTeam, writeLastSelectedCareTeam } from "./lastSelectedTeam";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("Đội cạo mủ đã chọn gần nhất", () => {
  it("lưu, đọc và xóa lựa chọn trên cùng thiết bị", () => {
    const storage = createStorage();
    writeLastSelectedCareTeam("Đội 3", storage);
    expect(storage.getItem(LAST_SELECTED_CARE_TEAM_KEY)).toBe("Đội 3");
    expect(readLastSelectedCareTeam(storage)).toBe("Đội 3");
    writeLastSelectedCareTeam("", storage);
    expect(readLastSelectedCareTeam(storage)).toBe("");
  });
});
