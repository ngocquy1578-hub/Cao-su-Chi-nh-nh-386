export const TEAM_ORDER = ["Đội 1", "Đội 2", "Đội 3", "Đội 4", "Đội 5", "Đội 6"] as const;

export function compareTeamName(left: string, right: string) {
  const leftIndex = TEAM_ORDER.indexOf(left as (typeof TEAM_ORDER)[number]);
  const rightIndex = TEAM_ORDER.indexOf(right as (typeof TEAM_ORDER)[number]);
  if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
  return left.localeCompare(right, "vi", { numeric: true, sensitivity: "base" });
}

export function comparePeriodLabel(left: string, right: string) {
  const parse = (label: string) => {
    const match = label.match(/đợt\s*(\d+)\s*[-/]\s*(\d+)/i);
    if (match) return { month: Number(match[2]), period: Number(match[1]), label };
    const simple = label.match(/đợt\s*(\d+)/i);
    return { month: Number.MAX_SAFE_INTEGER - 1, period: simple ? Number(simple[1]) : Number.MAX_SAFE_INTEGER, label };
  };
  const a = parse(left);
  const b = parse(right);
  return a.month - b.month || a.period - b.period || a.label.localeCompare(b.label, "vi", { numeric: true });
}
