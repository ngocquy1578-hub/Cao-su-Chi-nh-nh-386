import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createPlot: vi.fn(),
  listPlots: vi.fn(),
  updatePlotGardenType: vi.fn(),
  logActivity: vi.fn(),
  saveLatexImport: vi.fn(),
  getPlotById: vi.fn(),
  getInternalAccountByUserId: vi.fn(),
  getProgressReport: vi.fn(),
  updatePlotMap: vi.fn(),
  getWorkforceTeamSummary: vi.fn(),
  getManagementGroupSummary: vi.fn(),
  saveManagementGroupTargets: vi.fn(),
  getLatexProductionManagement: vi.fn(),
  getDashboard: vi.fn(),
  getDashboardPreferences: vi.fn(),
  saveDashboardPreferences: vi.fn(),
  getWorkforceMonthlySnapshots: vi.fn(),
  getWorkforceTeamMonthlySnapshots: vi.fn(),
  getWorkerPlotAreaDistribution: vi.fn(),
  listPlotAllocationHistory: vi.fn(),
  captureWorkforceMonthlySnapshot: vi.fn(),
  listTeamExports: vi.fn(),
  getTeamLatexBalance: vi.fn(),
  bulkUpsertTeamExports: vi.fn(),
  listPlotLatexProductions: vi.fn(),
  savePlotLatexProduction: vi.fn(),
  bulkUpsertPlotLatexProductions: vi.fn(),
  assertPlotProductionPeriodsUnlocked: vi.fn(),
  listPlotProductionPeriodLocks: vi.fn(),
  lockPlotProductionPeriod: vi.fn(),
  unlockPlotProductionPeriod: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", () => ({
  ...dbMocks,
  listPlots: dbMocks.listPlots,
  updatePlot: vi.fn(),
  removePlot: vi.fn(),
  listLatexImports: vi.fn(),
  createLatexExport: vi.fn(),
  listLatexExports: vi.fn(),
  createCareActivity: vi.fn(),
  listCareActivities: vi.fn(),
  listWorkers: vi.fn(),
  createWorker: vi.fn(),
  createAssignment: vi.fn(),
  listAssignments: vi.fn(),
  listPeriods: vi.fn(),
  getDashboard: dbMocks.getDashboard,
  getWorkforceTeamSummary: dbMocks.getWorkforceTeamSummary,
  getManagementGroupSummary: dbMocks.getManagementGroupSummary,
  saveManagementGroupTargets: dbMocks.saveManagementGroupTargets,
  getLatexProductionManagement: dbMocks.getLatexProductionManagement,
  getDashboardPreferences: dbMocks.getDashboardPreferences,
  saveDashboardPreferences: dbMocks.saveDashboardPreferences,
  getWorkforceMonthlySnapshots: dbMocks.getWorkforceMonthlySnapshots,
  getWorkforceTeamMonthlySnapshots: dbMocks.getWorkforceTeamMonthlySnapshots,
  getWorkerPlotAreaDistribution: dbMocks.getWorkerPlotAreaDistribution,
  listPlotAllocationHistory: dbMocks.listPlotAllocationHistory,
  captureWorkforceMonthlySnapshot: dbMocks.captureWorkforceMonthlySnapshot,
  listPlotLatexProductions: dbMocks.listPlotLatexProductions,
  savePlotLatexProduction: dbMocks.savePlotLatexProduction,
  bulkUpsertPlotLatexProductions: dbMocks.bulkUpsertPlotLatexProductions,
  assertPlotProductionPeriodsUnlocked: dbMocks.assertPlotProductionPeriodsUnlocked,
  listPlotProductionPeriodLocks: dbMocks.listPlotProductionPeriodLocks,
  lockPlotProductionPeriod: dbMocks.lockPlotProductionPeriod,
  unlockPlotProductionPeriod: dbMocks.unlockPlotProductionPeriod,
}));

vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

function makeContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-user`,
      name: role,
      email: `${role}@example.com`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("rubberRouter authorization and business procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trả về quản lý sản lượng theo tháng, năm và đội trong phạm vi được phép", async () => {
    dbMocks.getLatexProductionManagement.mockResolvedValue({ year: 2026, month: 8, unit: "Đội 1", frozenLatex: 100, latexThread: 5, totalImport: 105, previousMonth: 7, previousYear: 2026, previousTotalImport: 80, importChange: 25, importRecordCount: 2, exportRecordCount: 1, availableUnits: ["Đội 1"] });
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.latexProductionManagement({ year: 2026, month: 8, unit: "Đội 1" })).resolves.toMatchObject({ totalImport: 105, previousTotalImport: 80, importChange: 25, importRecordCount: 2 });
    expect(dbMocks.getLatexProductionManagement).toHaveBeenCalledWith({ year: 2026, month: 8, unit: "Đội 1" }, undefined);
  });

  it("lưu và khôi phục cấu hình cột Tổng quan theo đúng tài khoản", async () => {
    const columns = { area: true, plots: false, workforce: true, production: false };
    dbMocks.getDashboardPreferences.mockResolvedValue({ teamOverviewColumns: columns });
    dbMocks.saveDashboardPreferences.mockResolvedValue({ teamOverviewColumns: columns });
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.dashboardPreferences.get()).resolves.toEqual({ teamOverviewColumns: columns });
    await expect(caller.rubber.dashboardPreferences.save({ teamOverviewColumns: columns })).resolves.toEqual({ teamOverviewColumns: columns });
    expect(dbMocks.getDashboardPreferences).toHaveBeenCalledWith(1);
    expect(dbMocks.saveDashboardPreferences).toHaveBeenCalledWith(1, columns);
  });

  it("trả so sánh sản lượng cùng quý năm trước theo từng đội", async () => {
    dbMocks.getDashboard.mockResolvedValue({
      quarterlyYearComparison: {
        currentLabel: "Quý 3/2026",
        previousLabel: "Quý 3/2025",
        hasPreviousData: false,
        teams: [{ unit: "Đội 1", currentTotalImport: 50007, previousTotalImport: null, importChange: null, changePercent: null }],
      },
    });
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.dashboard({ periodLabel: "Đợt 1" })).resolves.toMatchObject({ quarterlyYearComparison: { currentLabel: "Quý 3/2026", previousLabel: "Quý 3/2025", hasPreviousData: false } });
    expect(dbMocks.getDashboard).toHaveBeenCalledWith("Đợt 1", undefined);
  });

  it("chỉ cho phép admin tạo vườn", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.rubber.plots.create({ code: "VA-01", name: "Vườn A", unit: "Đội 1", areaHa: 12.5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.createPlot).not.toHaveBeenCalled();
  });

  it("cho phép admin tạo vườn và gắn đúng người tạo", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.plots.create({ code: "VA-01", name: "Vườn A", unit: "Đội 1", tappingDay: 6, areaHa: 12.5 })).resolves.toEqual({ success: true });
    expect(dbMocks.createPlot).toHaveBeenCalledWith(expect.objectContaining({ code: "VA-01", tappingDay: 6, areaHa: 12.5 }), 1);
  });

  it("chỉ nhận Ngày cạo từ 1 đến 31", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.plots.create({ code: "VA-02", name: "Vườn A", unit: "Đội 1", tappingDay: 32, areaHa: 12.5 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createPlot).not.toHaveBeenCalled();
  });

  it("ghi nhật ký khi admin cập nhật vườn", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.plots.update({ id: 8, data: { code: "VA-01", name: "Vườn A", unit: "Đội 1", areaHa: 13 } })).resolves.toEqual({ success: true });
    expect(dbMocks.logActivity).toHaveBeenCalledWith(1, expect.objectContaining({ eventType: "plot.update", entityId: 8 }));
  });

  it("chỉ admin được phân bổ hàng loạt lô vào một loại vườn và phải ghi nhật ký", async () => {
    const adminCaller = appRouter.createCaller(makeContext("admin"));
    dbMocks.updatePlotGardenType.mockResolvedValue(3);
    dbMocks.listPlots.mockResolvedValue([{ id: 8, unit: "Đội 1" }, { id: 9, unit: "Đội 1" }, { id: 10, unit: "Đội 1" }]);
    await expect(adminCaller.rubber.plots.bulkAssignGardenType({ plotIds: [8, 9, 9, 10], gardenType: "B", rowStart: 1, rowEnd: 10, areaHa: 2.35, tappingTrees: 460 })).resolves.toEqual({ success: true, updated: 3 });
    expect(dbMocks.updatePlotGardenType).toHaveBeenCalledWith([8, 9, 10], "B", { rowStart: 1, rowEnd: 10, areaHa: 2.35, tappingTrees: 460 });
    expect(dbMocks.logActivity).toHaveBeenCalledWith(1, expect.objectContaining({ eventType: "plot.garden_type.bulk_assign", metadata: expect.objectContaining({ gardenType: "B", count: 3 }) }));
    const userCaller = appRouter.createCaller(makeContext("user"));
    await expect(userCaller.rubber.plots.bulkAssignGardenType({ plotIds: [8], gardenType: "A" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("chỉ admin xem được lịch sử phân bổ lô theo Đội", async () => {
    dbMocks.listPlotAllocationHistory.mockResolvedValue([{ id: 1, eventType: "plot.garden_type.bulk_assign", metadata: { unit: "Đội 2", gardenType: "A" } }]);
    const adminCaller = appRouter.createCaller(makeContext("admin"));
    await expect(adminCaller.rubber.plots.allocationHistory({ unit: "Đội 2" })).resolves.toHaveLength(1);
    expect(dbMocks.listPlotAllocationHistory).toHaveBeenCalledWith("Đội 2");
    await expect(appRouter.createCaller(makeContext("user")).rubber.plots.allocationHistory({ unit: "Đội 2" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cho phép người dùng đã đăng nhập lưu nhập mủ và báo cáo tiến độ", async () => {
    dbMocks.getProgressReport.mockResolvedValue([]);
    dbMocks.getPlotById.mockResolvedValue({ id: 8, unit: "Đội 1" });
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, scopeUnits: JSON.stringify(["Đội 1"]), permissionProfile: JSON.stringify(["latex:write", "reports:read"]) });
    const caller = appRouter.createCaller(makeContext("user"));
    const recordDate = new Date("2026-07-05T12:00:00.000Z");
    await caller.rubber.imports.save({ plotId: 8, periodLabel: "Đợt 1", recordDate, frozenLatex: 125, latexThread: 8 });
    await caller.rubber.reports.progress({ periodLabel: "Đợt 1" });
    expect(dbMocks.saveLatexImport).toHaveBeenCalledWith(expect.objectContaining({ plotId: 8, frozenLatex: 125, latexThread: 8 }), 2);
    expect(dbMocks.getProgressReport).toHaveBeenCalledWith("Đợt 1");
  });

  it("lưu xuất mủ theo Đội và trả hao kho từ dữ liệu nhập xuất thực", async () => {
    dbMocks.bulkUpsertTeamExports.mockResolvedValue(undefined);
    dbMocks.getTeamLatexBalance.mockResolvedValue({ unit: "Đội 1", periodLabel: "Đợt 1", totalImport: 1000, totalExport: 700, warehouseLoss: 300, exceedsImport: 0 });
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.exports.teamCreate({ unit: "Đội 1", periodLabel: "Đợt 1", recordDate: new Date("2026-08-23"), frozenContaminatedLatex: 200, latexThread: 10, note: "Đã đối chiếu" })).resolves.toEqual({ success: true });
    await expect(caller.rubber.exports.teamBalance({ unit: "Đội 1", periodLabel: "Đợt 1" })).resolves.toMatchObject({ totalImport: 1000, warehouseLoss: 300 });
    expect(dbMocks.bulkUpsertTeamExports).toHaveBeenCalledWith([expect.objectContaining({ unit: "Đội 1", frozenContaminatedLatex: 200, latexThread: 10, note: "Đã đối chiếu" })], 1);
  });

  it("lưu và import Mủ đông/tạp, Quy khô theo lô trong đúng phạm vi Đội", async () => {
    const recordDate = new Date("2026-08-23T12:00:00.000Z");
    dbMocks.getPlotById.mockResolvedValue({ id: 8, name: "Lô 8", unit: "Đội 1" });
    dbMocks.listPlots.mockResolvedValue([{ id: 8, name: "Lô 8", unit: "Đội 1" }]);
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.plotProduction.create({ plotId: 8, recordDate, frozenContaminatedLatex: 120, dryRubber: 90, note: "Nhập tay" })).resolves.toEqual({ success: true });
    await expect(caller.rubber.plotProduction.import({ rows: [{ plotId: 8, recordDate, frozenContaminatedLatex: 130, dryRubber: 95, note: "Excel" }] })).resolves.toEqual({ imported: 1 });
    expect(dbMocks.savePlotLatexProduction).toHaveBeenCalledWith(expect.objectContaining({ plotId: 8, dryRubber: 90 }), 1);
    expect(dbMocks.bulkUpsertPlotLatexProductions).toHaveBeenCalledWith([expect.objectContaining({ plotId: 8, frozenContaminatedLatex: 130, dryRubber: 95 })], 1, "Excel import");
  });

  it("nhập nhanh nhiều Lô cùng kỳ và ghi nguồn Nhập nhanh", async () => {
    const recordDate = new Date("2026-08-01T12:00:00.000Z");
    dbMocks.listPlots.mockResolvedValue([{ id: 8, unit: "Đội 1" }, { id: 9, unit: "Đội 1" }]);
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.plotProduction.bulkCreate({ rows: [{ plotId: 8, recordDate, frozenContaminatedLatex: 10, dryRubber: 8 }, { plotId: 9, recordDate, frozenContaminatedLatex: 12, dryRubber: 9 }] })).resolves.toEqual({ imported: 2 });
    expect(dbMocks.bulkUpsertPlotLatexProductions).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ plotId: 8 }), expect.objectContaining({ plotId: 9 })]), 1, "Nhập nhanh");
  });

  it("chỉ admin được chốt hoặc mở khóa kỳ sản lượng theo tháng", async () => {
    dbMocks.lockPlotProductionPeriod.mockResolvedValue({ year: 2026, month: 8, lockedBy: 1 });
    const adminCaller = appRouter.createCaller(makeContext("admin"));
    await expect(adminCaller.rubber.plotProduction.lockPeriod({ year: 2026, month: 8 })).resolves.toMatchObject({ success: true, lock: { year: 2026, month: 8 } });
    await expect(adminCaller.rubber.plotProduction.unlockPeriod({ year: 2026, month: 8 })).resolves.toEqual({ success: true });
    expect(dbMocks.lockPlotProductionPeriod).toHaveBeenCalledWith(2026, 8, 1);
    expect(dbMocks.unlockPlotProductionPeriod).toHaveBeenCalledWith(2026, 8);
    await expect(appRouter.createCaller(makeContext("user")).rubber.plotProduction.lockPeriod({ year: 2026, month: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("không lưu sản lượng khi tháng đã được chốt", async () => {
    dbMocks.getPlotById.mockResolvedValue({ id: 8, name: "Lô 8", unit: "Đội 1" });
    dbMocks.assertPlotProductionPeriodsUnlocked.mockRejectedValue(new Error("Tháng 8/2026 đã chốt"));
    await expect(appRouter.createCaller(makeContext("admin")).rubber.plotProduction.create({ plotId: 8, recordDate: new Date("2026-08-01T12:00:00.000Z"), frozenContaminatedLatex: 120, dryRubber: 90 })).rejects.toThrow("Tháng 8/2026 đã chốt");
    expect(dbMocks.savePlotLatexProduction).not.toHaveBeenCalled();
  });

  it("chỉ admin có thể lưu sơ đồ lô vườn và metadata S3 được gắn với vườn", async () => {
    const encodedImage = Buffer.from("map-bytes").toString("base64");
    storageMocks.storagePut.mockResolvedValue({ key: "rubber/plot-map.png", url: "/manus-storage/rubber/plot-map.png" });
    const adminCaller = appRouter.createCaller(makeContext("admin"));
    await adminCaller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do.png", mimeType: "image/png", contentBase64: encodedImage });
    expect(storageMocks.storagePut).toHaveBeenCalledWith(expect.stringContaining("plots/8/so-do-lo-vuon.png"), expect.any(Buffer), "image/png");
    expect(dbMocks.updatePlotMap).toHaveBeenCalledWith(8, "rubber/plot-map.png", "/manus-storage/rubber/plot-map.png");

    const userCaller = appRouter.createCaller(makeContext("user"));
    await expect(userCaller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do.png", mimeType: "image/png", contentBase64: encodedImage })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("từ chối sơ đồ vượt 5 MB trước khi gửi vào kho lưu trữ", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    const oversizedBase64 = "A".repeat(6_999_999);
    await expect(caller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do.png", mimeType: "image/png", contentBase64: oversizedBase64 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });

  it("từ chối MIME sơ đồ không hợp lệ trước khi gọi kho lưu trữ", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    const encodedImage = Buffer.from("not-an-image").toString("base64");
    await expect(caller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do.gif", mimeType: "image/gif" as never, contentBase64: encodedImage })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });

  it("thay thế liên kết sơ đồ cũ bằng tệp S3 mới của cùng một vườn", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    const encodedImage = Buffer.from("updated-map").toString("base64");
    storageMocks.storagePut.mockResolvedValueOnce({ key: "rubber/plot-map-v1.png", url: "/manus-storage/rubber/plot-map-v1.png" }).mockResolvedValueOnce({ key: "rubber/plot-map-v2.png", url: "/manus-storage/rubber/plot-map-v2.png" });
    await caller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do-cu.png", mimeType: "image/png", contentBase64: encodedImage });
    await caller.rubber.plots.uploadMap({ plotId: 8, fileName: "so-do-moi.png", mimeType: "image/png", contentBase64: encodedImage });
    expect(dbMocks.updatePlotMap).toHaveBeenLastCalledWith(8, "rubber/plot-map-v2.png", "/manus-storage/rubber/plot-map-v2.png");
  });

  it("rút gọn danh sách với tài khoản không thuộc Đội và chỉ mở đầy đủ cho tài khoản Đội", async () => {
    dbMocks.getWorkforceTeamSummary.mockResolvedValue([{ unit: "Đội 1", workers: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], staffingCount: 4, staffingTarget: 4, activeCount: 4, inactiveCount: 0, shortageCount: 0, surplusCount: 0 }]);
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, groupType: "functional", scopeUnits: JSON.stringify([]), permissionProfile: JSON.stringify(["workers:read"]) });
    await expect(appRouter.createCaller(makeContext("user")).rubber.workforce.workers.teams()).resolves.toMatchObject({ expandedUnits: [], teams: [{ unit: "Đội 1", totalWorkerCount: 4, workers: [{ id: 1 }, { id: 2 }, { id: 3 }] }] });
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, groupType: "production", scopeUnits: JSON.stringify(["Đội 1"]), permissionProfile: JSON.stringify(["workers:read"]) });
    await expect(appRouter.createCaller(makeContext("user")).rubber.workforce.workers.teams()).resolves.toMatchObject({ expandedUnits: ["Đội 1"], teams: [{ unit: "Đội 1", totalWorkerCount: 4, workers: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] }] });
  });

  it("cung cấp lịch sử nhân công cho quản trị viên và cho phép chốt snapshot tháng", async () => {
    const history = [{ month: "2026-08", activeCount: 335, totalCount: 335 }];
    dbMocks.getWorkforceMonthlySnapshots.mockResolvedValue(history);
    dbMocks.captureWorkforceMonthlySnapshot.mockResolvedValue(history[0]);
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.rubber.workforce.workers.monthlyHistory()).resolves.toEqual(history);
    await expect(caller.rubber.workforce.workers.captureMonthlySnapshot()).resolves.toEqual(history[0]);
    expect(dbMocks.captureWorkforceMonthlySnapshot).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}$/), 1);
  });

  it("giới hạn lịch sử nhân công theo phạm vi Đội của tài khoản", async () => {
    const snapshots = [{ month: "2026-08", unit: "Đội 1", activeCount: 60, totalCount: 60 }, { month: "2026-08", unit: "Đội 2", activeCount: 54, totalCount: 54 }];
    dbMocks.getWorkforceTeamMonthlySnapshots.mockResolvedValue(snapshots);
    await expect(appRouter.createCaller(makeContext("admin")).rubber.workforce.workers.monthlyHistoryByTeam()).resolves.toEqual(snapshots);
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, groupType: "production", scopeUnits: JSON.stringify(["Đội 1"]), permissionProfile: JSON.stringify(["workers:read"]) });
    await expect(appRouter.createCaller(makeContext("user")).rubber.workforce.workers.monthlyHistoryByTeam()).resolves.toEqual([snapshots[0]]);
  });

  it("trả phân bố diện tích theo phạm vi Đội được cấp quyền", async () => {
    dbMocks.getWorkerPlotAreaDistribution.mockResolvedValue({ teams: [{ unit: "Đội 2", totalAreaHa: 268.496, plotCount: 40, allocatedAreaHa: 0, allocationCount: 0 }], workers: [] });
    dbMocks.getInternalAccountByUserId.mockResolvedValue({ isActive: 1, groupType: "production", scopeUnits: JSON.stringify(["Đội 2"]), permissionProfile: JSON.stringify(["workers:read"]) });
    const result = await appRouter.createCaller(makeContext("user")).rubber.workforce.workers.areaDistribution({ gardenType: "A" });
    expect(dbMocks.getWorkerPlotAreaDistribution).toHaveBeenCalledWith(["Đội 2"], "A");
    expect(result).toMatchObject({ teams: [{ unit: "Đội 2" }], workers: [] });
  });

  it("chỉ admin được lưu chỉ tiêu ba nhóm đội ngũ quản lý", async () => {
    const targets = [{ groupType: "board" as const, staffingTarget: 3 }, { groupType: "functional" as const, staffingTarget: 9 }, { groupType: "production" as const, staffingTarget: 17 }];
    await expect(appRouter.createCaller(makeContext("admin")).rubber.workforce.workers.managementTargets.save({ targets })).resolves.toEqual({ success: true });
    expect(dbMocks.saveManagementGroupTargets).toHaveBeenCalledWith(targets, 1);
    await expect(appRouter.createCaller(makeContext("user")).rubber.workforce.workers.managementTargets.save({ targets })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
