import { compareTeamName } from "@shared/teamOrder";

export type SortablePlot = { plantedYear: number | null; name: string; code: string };
export type TeamSortablePlot = SortablePlot & { unit: string };

function plotNameOrder(name: string) {
  const visibleName = name.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  const match = visibleName.match(/^lô\s*(\d+)(.*)$/i);
  if (!match) return { kind: 2, number: Number.MAX_SAFE_INTEGER, suffix: visibleName };
  const suffix = match[2].trim();
  return { kind: suffix ? 1 : 0, number: Number(match[1]), suffix };
}

export function comparePlotsByYearAndName(left: SortablePlot, right: SortablePlot) {
  const leftYear = left.plantedYear ?? Number(left.name.match(/\((\d{4})\)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
  const rightYear = right.plantedYear ?? Number(right.name.match(/\((\d{4})\)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
  const leftName = plotNameOrder(left.name);
  const rightName = plotNameOrder(right.name);
  return leftYear - rightYear || leftName.kind - rightName.kind || leftName.number - rightName.number || leftName.suffix.localeCompare(rightName.suffix, "vi", { numeric: true }) || left.name.localeCompare(right.name, "vi", { numeric: true }) || left.code.localeCompare(right.code, "vi", { numeric: true });
}

export function comparePlotsByTeamYearAndName(left: TeamSortablePlot, right: TeamSortablePlot) {
  return compareTeamName(left.unit, right.unit) || comparePlotsByYearAndName(left, right);
}
