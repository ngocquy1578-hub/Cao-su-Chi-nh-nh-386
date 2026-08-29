import { describe, expect, it } from "vitest";
import { summarizeWorkforceByTeam } from "./workforceSummary";

describe("summarizeWorkforceByTeam", () => {
  it("tổng hợp biên chế, đang hoạt động và thiếu theo đội; tên hiển thị được sắp theo tên phiên âm", () => {
    const rows = summarizeWorkforceByTeam([
      { id: 1, unit: "Đội 2", phoneticName: "xinh", status: "active" as const },
      { id: 2, unit: "Đội 1", phoneticName: "bình", status: "inactive" as const },
      { id: 3, unit: "Đội 1", phoneticName: "an", status: "active" as const },
    ], [{ unit: "Đội 1", staffingTarget: 1 }, { unit: "Đội 2", staffingTarget: 0 }]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ unit: "Đội 1", staffingCount: 2, staffingTarget: 1, activeCount: 1, inactiveCount: 1, shortageCount: 0, surplusCount: 0 });
    expect(rows[0]?.workers.map(worker => worker.phoneticName)).toEqual(["an", "bình"]);
    expect(rows[1]).toMatchObject({ unit: "Đội 2", staffingCount: 1, staffingTarget: 0, activeCount: 1, shortageCount: 0, surplusCount: 1 });
  });
});
