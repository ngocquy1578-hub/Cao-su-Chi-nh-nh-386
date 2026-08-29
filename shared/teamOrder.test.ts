import { describe, expect, it } from "vitest";
import { comparePeriodLabel, compareTeamName } from "./teamOrder";

describe("compareTeamName", () => {
  it("luôn đưa Đội 1 đến Đội 6 lên trước theo thứ tự vận hành", () => {
    expect(["Đội 6", "Đội 2", "Đội 1", "Đội 5"].sort(compareTeamName)).toEqual(["Đội 1", "Đội 2", "Đội 5", "Đội 6"]);
  });
});

describe("comparePeriodLabel", () => {
  it("xếp theo tháng rồi số đợt", () => {
    expect(["Đợt 3-7", "Đợt 1-8", "Đợt 2-7", "Đợt 1-7", "Đợt 3-8", "Đợt 2-8"].sort(comparePeriodLabel)).toEqual(["Đợt 1-7", "Đợt 2-7", "Đợt 3-7", "Đợt 1-8", "Đợt 2-8", "Đợt 3-8"]);
  });
});
