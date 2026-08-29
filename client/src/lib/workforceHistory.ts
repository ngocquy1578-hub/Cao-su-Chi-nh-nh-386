export type WorkforceMonthSnapshot = { month: string; activeCount: number; totalCount: number };

export function buildWorkforceMonthHistory(snapshots: readonly WorkforceMonthSnapshot[]) {
  return snapshots.map((snapshot, index) => {
    const previous = index ? snapshots[index - 1] : null;
    const [year, month] = snapshot.month.split("-");
    return {
      ...snapshot,
      label: year && month ? `Tháng ${Number(month)}/${year}` : snapshot.month,
      activeChange: previous ? snapshot.activeCount - previous.activeCount : null,
      totalChange: previous ? snapshot.totalCount - previous.totalCount : null,
    };
  });
}
