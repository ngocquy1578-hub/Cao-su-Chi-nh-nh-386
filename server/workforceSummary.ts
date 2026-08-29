export type WorkforceSummaryWorker = {
  unit: string | null;
  phoneticName: string | null;
  status: "active" | "inactive";
};

export type WorkforceTeamTarget = { unit: string; staffingTarget: number };

export type WorkforceTeamSummary<T extends WorkforceSummaryWorker = WorkforceSummaryWorker> = {
  unit: string;
  staffingCount: number;
  staffingTarget: number | null;
  activeCount: number;
  inactiveCount: number;
  shortageCount: number | null;
  surplusCount: number | null;
  workers: T[];
};

const teamName = (unit: string | null) => unit?.trim() || "Chưa phân đội";

export function summarizeWorkforceByTeam<T extends WorkforceSummaryWorker>(workers: T[], targets: WorkforceTeamTarget[] = []): WorkforceTeamSummary<T>[] {
  const targetByUnit = new Map(targets.map(target => [target.unit.trim(), target.staffingTarget]));
  const groups = new Map<string, T[]>();
  workers.forEach(worker => {
    const unit = teamName(worker.unit);
    groups.set(unit, [...(groups.get(unit) ?? []), worker]);
  });

  return Array.from(groups.entries())
    .map(([unit, rows]) => {
      const sortedWorkers = [...rows].sort((left, right) => (left.phoneticName ?? "").localeCompare(right.phoneticName ?? "", "vi", { sensitivity: "base", numeric: true }));
      const activeCount = sortedWorkers.filter(worker => worker.status === "active").length;
      const staffingCount = sortedWorkers.length;
      const staffingTarget = targetByUnit.get(unit) ?? null;
      return {
        unit,
        staffingCount,
        staffingTarget,
        activeCount,
        inactiveCount: staffingCount - activeCount,
        shortageCount: staffingTarget == null ? null : Math.max(staffingTarget - activeCount, 0),
        surplusCount: staffingTarget == null ? null : Math.max(activeCount - staffingTarget, 0),
        workers: sortedWorkers,
      };
    })
    .sort((left, right) => compareTeamName(left.unit, right.unit));
}
import { compareTeamName } from "@shared/teamOrder";
