import { describe, expect, it } from "vitest";
import { buildTeamGardenPieData } from "./teamGardenPie";

describe("buildTeamGardenPieData", () => {
  it("tính diện tích và tỷ trọng A/B/C từ số liệu Đội", () => {
    const result = buildTeamGardenPieData({ A: 10, B: 20, C: 10 });
    expect(result.totalAreaHa).toBe(40);
    expect(result.items).toEqual([
      { gardenType: "A", label: "Vườn A", color: "#059669", areaHa: 10, percent: 25 },
      { gardenType: "B", label: "Vườn B", color: "#0284c7", areaHa: 20, percent: 50 },
      { gardenType: "C", label: "Vườn C", color: "#d97706", areaHa: 10, percent: 25 },
    ]);
  });

  it("không chia cho 0 khi Đội chưa có Lô phân loại", () => {
    expect(buildTeamGardenPieData({ A: 0, B: 0, C: 0 })).toMatchObject({ totalAreaHa: 0, items: [{ percent: 0 }, { percent: 0 }, { percent: 0 }] });
  });
});
