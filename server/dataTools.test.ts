import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getExcelDataSummary: vi.fn(), listTeamImports: vi.fn(), listTeamExports: vi.fn(), getWarehouseLossByTeam: vi.fn(), getInternalAccountByUserId: vi.fn(),
  bulkUpsertExcelPlots: vi.fn(), bulkUpsertExcelWorkers: vi.fn(), bulkUpdateWorkerCodes: vi.fn(), bulkUpdatePlotIndicators: vi.fn(), bulkUpsertTeamImports: vi.fn(), bulkUpsertTeamExports: vi.fn(), bulkUpsertWorkerPlotAllocations: vi.fn(), logActivity: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

function context(role: "admin" | "user"): TrpcContext {
  return { user: { id: role === "admin" ? 1 : 2, openId: role, name: role, email: `${role}@example.com`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("dataToolsRouter", () => {
  it("chỉ trả về dữ liệu thuộc phạm vi đội của tài khoản", async () => {
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, scopeUnits: JSON.stringify(["Đội 1"]), permissionProfile: JSON.stringify(["reports:read"]) });
    dbMocks.listTeamImports.mockResolvedValue([{ unit: "Đội 1", totalImport: 100 }, { unit: "Đội 2", totalImport: 200 }]);
    await expect(appRouter.createCaller(context("user")).dataTools.teamImports()).resolves.toEqual([{ unit: "Đội 1", totalImport: 100 }]);
  });
  it("cho phép admin import dữ liệu nhập mủ theo đội", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const recordDate = new Date("2026-07-07T12:00:00.000Z");
    await expect(caller.dataTools.import.teamImports({ rows: [{ unit: "Đội 1", gardenName: "Vườn A", periodLabel: "Đợt 1", recordDate, frozenLatex: 1686, latexThread: 0 }] })).resolves.toEqual({ success: true, imported: 1 });
    expect(dbMocks.bulkUpsertTeamImports).toHaveBeenCalledWith(expect.any(Array), 1);
    expect(dbMocks.logActivity).toHaveBeenCalledWith(1, expect.objectContaining({ eventType: "excel.import", entityType: "team_imports" }));
  });

  it("từ chối người dùng thường import dữ liệu Excel", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.dataTools.import.workers({ rows: [{ unit: "Đội 1", name: "Người lao động", gender: "male", status: "active" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nhận mã số khi quản trị viên import nhân công", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.dataTools.import.workers({ rows: [{ unit: "Đội 1", name: "Người lao động", employeeCode: "NC-001", phoneticName: "nguoi lao dong", gender: "male", status: "active" }] })).resolves.toEqual({ success: true, imported: 1 });
    expect(dbMocks.bulkUpsertExcelWorkers).toHaveBeenCalledWith([expect.objectContaining({ employeeCode: "NC-001" })], 1);
  });

  it("chỉ cho admin cập nhật mã số nhân công hàng loạt", async () => {
    dbMocks.bulkUpdateWorkerCodes.mockResolvedValue(1);
    const admin = appRouter.createCaller(context("admin"));
    await expect(admin.dataTools.import.workerCodes({ rows: [{ unit: "Đội 1", phoneticName: "nguoi lao dong", employeeCode: "NC-001" }] })).resolves.toEqual({ success: true, updated: 1 });
    expect(dbMocks.bulkUpdateWorkerCodes).toHaveBeenCalledWith([{ unit: "Đội 1", phoneticName: "nguoi lao dong", employeeCode: "NC-001" }]);
    const user = appRouter.createCaller(context("user"));
    await expect(user.dataTools.import.workerCodes({ rows: [{ unit: "Đội 1", phoneticName: "nguoi lao dong", employeeCode: "NC-001" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("chỉ cho admin cập nhật định kỳ chỉ số cây theo mã lô", async () => {
    dbMocks.bulkUpdatePlotIndicators.mockResolvedValue(1);
    const row = { code: "LO-DOI-1-2015-01", indicatorDate: new Date("2026-08-22T00:00:00.000Z"), inventoryPits: 500, inventoryTrees: 490, tappingTrees: 430, immatureTrees: 12, nonproductiveTrees: 8, diseasedTrees: 5, dryTappingTrees: 4, emptyPits: 10, tappingDensity: 420, plotRank: "A" };
    const admin = appRouter.createCaller(context("admin"));
    await expect(admin.dataTools.import.plotIndicators({ rows: [row] })).resolves.toEqual({ success: true, updated: 1 });
    expect(dbMocks.bulkUpdatePlotIndicators).toHaveBeenCalledWith([expect.objectContaining({ code: row.code, tappingTrees: 430 })]);
    await expect(appRouter.createCaller(context("user")).dataTools.import.plotIndicators({ rows: [row] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("trả về báo cáo hao hụt theo đúng kỳ được chọn", async () => {
    dbMocks.getWarehouseLossByTeam.mockResolvedValue({ rows: [], periods: ["Đợt 1-7"], totals: { totalImport: 100, totalExport: 90, lossKg: 10, lossPercent: 10 } });
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, scopeUnits: JSON.stringify([]), permissionProfile: JSON.stringify(["warehouse:read"]) });
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.dataTools.warehouseLoss({ periodLabel: "Đợt 1-7", monthLabel: "7/2026" })).resolves.toMatchObject({ totals: { lossKg: 10, lossPercent: 10 } });
    expect(dbMocks.getWarehouseLossByTeam).toHaveBeenCalledWith("Đợt 1-7", "7/2026");
  });

  it("chỉ cho admin import phân chia nhân công vườn cây", async () => {
    dbMocks.bulkUpsertWorkerPlotAllocations.mockResolvedValue(1);
    const rows = [{ unit: "Đội 2", workerName: "YIM RA", employeeCode: "NC-002", gardenType: "A" as const, plotCode: "LO-DOI-2-2012-7A", rowStart: 1, rowEnd: 12, areaHa: 2.35 }];
    await expect(appRouter.createCaller(context("admin")).dataTools.import.workerPlotAllocations({ rows })).resolves.toEqual({ success: true, imported: 1 });
    await expect(appRouter.createCaller(context("user")).dataTools.import.workerPlotAllocations({ rows })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
