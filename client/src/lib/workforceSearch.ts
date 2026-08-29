export type SearchableWorker = {
  phoneticName: string | null;
  employeeCode: string | null;
};

export type TeamWorker = {
  unit: string | null | undefined;
};

export function matchesWorkerSearch(worker: SearchableWorker, keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  if (!normalizedKeyword) return true;
  return [worker.phoneticName, worker.employeeCode]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("vi")
    .includes(normalizedKeyword);
}

export function workersInTeam<Worker extends TeamWorker>(workers: readonly Worker[], unit: string) {
  return workers.filter(worker => worker.unit === unit);
}

export function makeTeamWorkerExportRows(workers: ReadonlyArray<{ employeeCode: string | null; phoneticName: string | null; roleTitle: string; status: "active" | "inactive" }>) {
  return workers.map(worker => ({
    "Mã số": worker.employeeCode ?? "",
    "Tên phiên âm": worker.phoneticName ?? "",
    "Vai trò": worker.roleTitle,
    "Trạng thái": worker.status === "active" ? "Đang làm việc" : "Không hoạt động",
  }));
}
