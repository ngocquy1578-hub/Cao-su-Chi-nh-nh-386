import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { filterByScope, requirePermission } from "../access";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { summarizeWorkforceByTeam } from "../workforceSummary";
import { getVietnamMonthKey } from "../workforceSnapshotTime";

const requiredText = (label: string, max = 240) => z.string().trim().min(1, `${label} là bắt buộc`).max(max);
const dateInput = z.date();
const quantity = z.coerce.number().min(0, "Số lượng không được âm").max(99999999);

const plotInput = z.object({
  code: requiredText("Mã vườn", 48),
  name: requiredText("Tên vườn", 160),
  unit: requiredText("Đơn vị", 120),
  gardenType: z.enum(["A", "B", "C"]).optional().nullable(),
  tappingDay: z.coerce.number().int().min(1, "Ngày cạo từ 1 đến 31").max(31, "Ngày cạo từ 1 đến 31").optional().nullable(),
  rowStart: z.coerce.number().int().positive("Từ hàng phải lớn hơn 0").max(99999).optional().nullable(),
  rowEnd: z.coerce.number().int().positive("Đến hàng phải lớn hơn 0").max(99999).optional().nullable(),
  tappingTrees: z.coerce.number().int().min(0, "Số cây cạo không được âm").max(99999999).optional().nullable(),
  areaHa: z.coerce.number().positive("Diện tích phải lớn hơn 0").max(999999),
  note: z.string().max(1000).optional().nullable(),
}).refine(input => !input.rowStart || !input.rowEnd || input.rowEnd >= input.rowStart, { message: "Đến hàng phải lớn hơn hoặc bằng Từ hàng", path: ["rowEnd"] });

const importInput = z.object({
  plotId: z.number().int().positive(),
  recordDate: dateInput,
  periodLabel: requiredText("Đợt", 80),
  frozenLatex: quantity,
  latexThread: quantity,
  note: z.string().max(1000).optional().nullable(),
});

const exportInput = z.object({
  plotId: z.number().int().positive(),
  periodLabel: requiredText("Đợt", 80),
  recordDate: dateInput,
  frozenContaminatedLatex: quantity,
  latexThread: quantity,
  note: z.string().max(1000).optional().nullable(),
});

const teamExportInput = z.object({
  unit: requiredText("Đội", 120),
  periodLabel: requiredText("Đợt", 80),
  recordDate: dateInput,
  frozenContaminatedLatex: quantity,
  latexThread: quantity,
  note: z.string().max(1000).optional().nullable(),
});

const plotProductionInput = z.object({
  plotId: z.number().int().positive(),
  recordDate: dateInput,
  frozenContaminatedLatex: quantity,
  dryRubber: quantity,
  note: z.string().max(1000).optional().nullable(),
});
const plotProductionPeriodInput = z.object({ year: z.coerce.number().int().min(2000).max(2200), month: z.coerce.number().int().min(1).max(12) });

const allowedMapTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const mapUploadInput = z.object({
  plotId: z.number().int().positive(),
  fileName: requiredText("Tên tệp", 180),
  mimeType: z.enum(allowedMapTypes),
  contentBase64: z.string().min(1).max(7_000_000),
});

const mapExtension = (mimeType: (typeof allowedMapTypes)[number]) => ({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
})[mimeType];

export const rubberRouter = router({
  dashboard: protectedProcedure.input(z.object({ periodLabel: z.string().max(80).optional() }).optional()).query(async ({ input, ctx }) => { const profile = await requirePermission(ctx, "dashboard:read"); return db.getDashboard(input?.periodLabel, profile.fullAccess || !profile.scopeUnits.length ? undefined : profile.scopeUnits); }),
  latexProductionManagement: protectedProcedure.input(z.object({ year: z.coerce.number().int().min(2000).max(2200).optional(), month: z.coerce.number().int().min(1).max(12).optional(), unit: z.string().max(120).optional() }).optional()).query(async ({ input, ctx }) => { const profile = await requirePermission(ctx, "dashboard:read"); return db.getLatexProductionManagement(input ?? {}, profile.fullAccess || !profile.scopeUnits.length ? undefined : profile.scopeUnits); }),
  dashboardPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => { await requirePermission(ctx, "dashboard:read"); return db.getDashboardPreferences(ctx.user.id); }),
    save: protectedProcedure.input(z.object({ teamOverviewColumns: z.object({ area: z.boolean(), plots: z.boolean(), workforce: z.boolean(), production: z.boolean() }) })).mutation(async ({ input, ctx }) => { await requirePermission(ctx, "dashboard:read"); return db.saveDashboardPreferences(ctx.user.id, input.teamOverviewColumns); }),
  }),
  periods: protectedProcedure.query(async ({ ctx }) => { await requirePermission(ctx, "reports:read"); return db.listPeriods(); }),
  plots: router({
    list: protectedProcedure.query(async ({ ctx }) => filterByScope(await db.listPlots(), await requirePermission(ctx, "reports:read"))),
    allocationHistory: adminProcedure.input(z.object({ unit: z.string().trim().min(1).max(120).optional() }).optional()).query(({ input }) => db.listPlotAllocationHistory(input?.unit)),
    create: adminProcedure.input(plotInput).mutation(async ({ input, ctx }) => {
      await db.createPlot(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "plot.create", entityType: "plot", summary: `Tạo vườn ${input.code}`, metadata: { unit: input.unit, gardenType: input.gardenType ?? null, areaHa: input.areaHa } });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: plotInput })).mutation(async ({ input, ctx }) => {
      await db.updatePlot(input.id, input.data);
      await db.logActivity(ctx.user.id, { eventType: "plot.update", entityType: "plot", entityId: input.id, summary: `Cập nhật vườn ${input.data.code}`, metadata: { unit: input.data.unit, gardenType: input.data.gardenType ?? null, areaHa: input.data.areaHa } });
      return { success: true };
    }),
    bulkAssignGardenType: adminProcedure.input(z.object({ plotIds: z.array(z.number().int().positive()).min(1, "Chọn ít nhất một lô").max(500, "Chỉ cập nhật tối đa 500 lô mỗi lần"), gardenType: z.enum(["A", "B", "C"]), rowStart: z.coerce.number().int().positive("Từ hàng phải lớn hơn 0").max(99999).optional(), rowEnd: z.coerce.number().int().positive("Đến hàng phải lớn hơn 0").max(99999).optional(), areaHa: z.coerce.number().positive("Diện tích phải lớn hơn 0").max(999999).optional(), tappingTrees: z.coerce.number().int().min(0, "Số cây cạo không được âm").max(99999999).optional() }).refine(input => !input.rowStart || !input.rowEnd || input.rowEnd >= input.rowStart, { message: "Đến hàng phải lớn hơn hoặc bằng Từ hàng", path: ["rowEnd"] })).mutation(async ({ input, ctx }) => {
      const plotIds = Array.from(new Set(input.plotIds));
      const details = { rowStart: input.rowStart, rowEnd: input.rowEnd, areaHa: input.areaHa, tappingTrees: input.tappingTrees };
      const selectedPlots = (await db.listPlots()).filter(plot => plotIds.includes(plot.id));
      const updated = await db.updatePlotGardenType(plotIds, input.gardenType, details);
      const byUnit = selectedPlots.reduce((groups, plot) => { const current = groups.get(plot.unit) ?? []; current.push(plot.id); groups.set(plot.unit, current); return groups; }, new Map<string, number[]>());
      await Promise.all(Array.from(byUnit).map(([unit, unitPlotIds]) => db.logActivity(ctx.user.id, { eventType: "plot.garden_type.bulk_assign", entityType: "plot", summary: `Phân bổ ${unitPlotIds.length} lô ${unit} vào Vườn ${input.gardenType}`, metadata: { plotIds: unitPlotIds, gardenType: input.gardenType, count: unitPlotIds.length, unit, ...details } })));
      return { success: true, updated };
    }),
    allocateGardenPortion: adminProcedure.input(z.object({ plotId: z.number().int().positive(), gardenType: z.enum(["A", "B", "C"]), areaHa: z.coerce.number().positive("Diện tích phải lớn hơn 0").max(999999), tappingTrees: z.coerce.number().int().min(0, "Số cây cạo không được âm").max(99999999) })).mutation(async ({ input, ctx }) => {
      const plot = await db.getPlotById(input.plotId);
      if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy Lô" });
      const result = await db.allocatePlotGardenPortion(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "plot.garden_portion.allocate", entityType: "plot_garden_allocation", entityId: input.plotId, summary: `Phân bổ ${plot.name} vào Vườn ${input.gardenType}`, metadata: { plotId: input.plotId, plotCode: plot.code, plotName: plot.name, unit: plot.unit, gardenType: input.gardenType, areaHa: input.areaHa, tappingTrees: input.tappingTrees, remainingAreaHa: result.remainingAreaHa, remainingTappingTrees: result.remainingTappingTrees } });
      return { success: true, ...result };
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      await db.removePlot(input.id);
      await db.logActivity(ctx.user.id, { eventType: "plot.remove", entityType: "plot", entityId: input.id, summary: "Xóa vườn" });
      return { success: true };
    }),
    uploadMap: adminProcedure.input(mapUploadInput).mutation(async ({ input, ctx }) => {
      const bytes = Buffer.from(input.contentBase64, "base64");
      if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sơ đồ phải là ảnh PNG, JPG hoặc WEBP có dung lượng tối đa 5 MB" });
      }
      const stored = await storagePut(`rubber-plantation/${ctx.user.id}/plots/${input.plotId}/so-do-lo-vuon.${mapExtension(input.mimeType)}`, bytes, input.mimeType);
      await db.updatePlotMap(input.plotId, stored.key, stored.url);
      await db.logActivity(ctx.user.id, { eventType: "plot.map.update", entityType: "plot", entityId: input.plotId, summary: "Tải hoặc thay thế sơ đồ lô vườn", metadata: { fileName: input.fileName, mimeType: input.mimeType } });
      return { success: true, url: stored.url };
    }),
    clearMap: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      await db.updatePlotMap(input.id, null, null);
      await db.logActivity(ctx.user.id, { eventType: "plot.map.remove", entityType: "plot", entityId: input.id, summary: "Gỡ sơ đồ lô vườn" });
      return { success: true };
    }),
  }),
  imports: router({
    list: protectedProcedure.input(z.object({ periodLabel: z.string().max(80).optional() }).optional()).query(async ({ input, ctx }) => filterByScope(await db.listLatexImports(input?.periodLabel), await requirePermission(ctx, "reports:read"))),
    save: protectedProcedure.input(importInput).mutation(async ({ input, ctx }) => {
      const plot = await db.getPlotById(input.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy vườn" }); await requirePermission(ctx, "latex:write", plot.unit);
      await db.saveLatexImport(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "latex.import.save", entityType: "latex_import", entityId: input.plotId, summary: `Ghi nhận nhập mủ ${input.periodLabel}`, metadata: { frozenLatex: input.frozenLatex, latexThread: input.latexThread } });
      return { success: true };
    }),
  }),
  exports: router({
    list: protectedProcedure.input(z.object({ periodLabel: z.string().max(80).optional() }).optional()).query(async ({ input, ctx }) => filterByScope(await db.listLatexExports(input?.periodLabel), await requirePermission(ctx, "reports:read"))),
    teamList: protectedProcedure.query(async ({ ctx }) => filterByScope(await db.listTeamExports(), await requirePermission(ctx, "reports:read"))),
    teamBalance: protectedProcedure.input(z.object({ unit: requiredText("Đội", 120), periodLabel: requiredText("Đợt", 80) })).query(async ({ input, ctx }) => {
      await requirePermission(ctx, "latex:write", input.unit);
      return db.getTeamLatexBalance(input.unit, input.periodLabel);
    }),
    create: protectedProcedure.input(exportInput).mutation(async ({ input, ctx }) => {
      const plot = await db.getPlotById(input.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy vườn" }); await requirePermission(ctx, "latex:write", plot.unit);
      await db.createLatexExport(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "latex.export.save", entityType: "latex_export", entityId: input.plotId, summary: `Ghi nhận xuất mủ ${input.periodLabel}`, metadata: { frozenContaminatedLatex: input.frozenContaminatedLatex, latexThread: input.latexThread } });
      return { success: true };
    }),
    teamCreate: protectedProcedure.input(teamExportInput).mutation(async ({ input, ctx }) => {
      await requirePermission(ctx, "latex:write", input.unit);
      await db.bulkUpsertTeamExports([input], ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "latex.export.team_save", entityType: "team_latex_export", summary: `Ghi nhận xuất mủ ${input.unit} ${input.periodLabel}`, metadata: { unit: input.unit, frozenContaminatedLatex: input.frozenContaminatedLatex, latexThread: input.latexThread, totalExport: input.frozenContaminatedLatex + input.latexThread, note: input.note ?? null } });
      return { success: true };
    }),
  }),
  plotProduction: router({
    list: protectedProcedure.query(async ({ ctx }) => filterByScope(await db.listPlotLatexProductions(), await requirePermission(ctx, "reports:read"))),
    periodLocks: protectedProcedure.query(async ({ ctx }) => { await requirePermission(ctx, "reports:read"); return db.listPlotProductionPeriodLocks(); }),
    lockPeriod: adminProcedure.input(plotProductionPeriodInput).mutation(async ({ input, ctx }) => {
      const lock = await db.lockPlotProductionPeriod(input.year, input.month, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "latex.plot_production.period_lock", entityType: "plot_production_period", entityId: `${input.year}-${input.month}`, summary: `Chốt sản lượng Tháng ${input.month}/${input.year}`, metadata: { year: input.year, month: input.month } });
      return { success: true, lock };
    }),
    unlockPeriod: adminProcedure.input(plotProductionPeriodInput).mutation(async ({ input, ctx }) => {
      await db.unlockPlotProductionPeriod(input.year, input.month);
      await db.logActivity(ctx.user.id, { eventType: "latex.plot_production.period_unlock", entityType: "plot_production_period", entityId: `${input.year}-${input.month}`, summary: `Mở khóa sản lượng Tháng ${input.month}/${input.year}`, metadata: { year: input.year, month: input.month } });
      return { success: true };
    }),
    create: protectedProcedure.input(plotProductionInput).mutation(async ({ input, ctx }) => {
      const plot = await db.getPlotById(input.plotId);
      if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy lô" });
      await requirePermission(ctx, "latex:write", plot.unit);
      await db.assertPlotProductionPeriodsUnlocked([input.recordDate]);
      await db.savePlotLatexProduction(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "latex.plot_production.save", entityType: "plot_latex_production", entityId: input.plotId, summary: `Ghi nhận sản lượng lô ${plot.name}`, metadata: { unit: plot.unit, recordDate: input.recordDate.toISOString(), frozenContaminatedLatex: input.frozenContaminatedLatex, dryRubber: input.dryRubber } });
      return { success: true };
    }),
    import: protectedProcedure.input(z.object({ rows: z.array(plotProductionInput).min(1, "Cần ít nhất một dòng dữ liệu").max(1000, "Chỉ nhập tối đa 1.000 dòng mỗi lần") })).mutation(async ({ input, ctx }) => {
      const plots = await db.listPlots();
      const plotById = new Map(plots.map(plot => [plot.id, plot]));
      const units = new Set<string>();
      input.rows.forEach(row => { const plot = plotById.get(row.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: `Không tìm thấy lô mã ${row.plotId}` }); units.add(plot.unit); });
      for (const unit of Array.from(units)) await requirePermission(ctx, "latex:write", unit);
      await db.assertPlotProductionPeriodsUnlocked(input.rows.map(row => row.recordDate));
      await db.bulkUpsertPlotLatexProductions(input.rows, ctx.user.id, "Excel import");
      await db.logActivity(ctx.user.id, { eventType: "latex.plot_production.import", entityType: "plot_latex_production", summary: `Import ${input.rows.length} dòng sản lượng theo lô`, metadata: { rows: input.rows.length, units: Array.from(units) } });
      return { imported: input.rows.length };
    }),
    bulkCreate: protectedProcedure.input(z.object({ rows: z.array(plotProductionInput).min(1, "Cần ít nhất một Lô để nhập").max(200, "Chỉ nhập tối đa 200 Lô mỗi lần") })).mutation(async ({ input, ctx }) => {
      const plots = await db.listPlots();
      const plotById = new Map(plots.map(plot => [plot.id, plot]));
      const units = new Set<string>();
      input.rows.forEach(row => { const plot = plotById.get(row.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: `Không tìm thấy lô mã ${row.plotId}` }); units.add(plot.unit); });
      for (const unit of Array.from(units)) await requirePermission(ctx, "latex:write", unit);
      await db.assertPlotProductionPeriodsUnlocked(input.rows.map(row => row.recordDate));
      await db.bulkUpsertPlotLatexProductions(input.rows, ctx.user.id, "Nhập nhanh");
      await db.logActivity(ctx.user.id, { eventType: "latex.plot_production.bulk_create", entityType: "plot_latex_production", summary: `Nhập nhanh ${input.rows.length} Lô sản lượng`, metadata: { rows: input.rows.length, units: Array.from(units), recordDate: input.rows[0]?.recordDate.toISOString() } });
      return { imported: input.rows.length };
    }),
  }),
  care: router({
    list: protectedProcedure.query(async ({ ctx }) => filterByScope(await db.listCareActivities(), await requirePermission(ctx, "care:read"))),
    create: protectedProcedure.input(z.object({ plotId: z.number().int().positive(), activityDate: dateInput, description: requiredText("Mô tả", 2000) })).mutation(async ({ input, ctx }) => {
      const plot = await db.getPlotById(input.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy vườn" }); await requirePermission(ctx, "care:write", plot.unit);
      await db.createCareActivity(input, ctx.user.id);
      await db.logActivity(ctx.user.id, { eventType: "care.create", entityType: "care_activity", entityId: input.plotId, summary: "Thêm nhật ký chăm sóc" });
      return { success: true };
    }),
  }),
  workforce: router({
    workers: router({
      list: protectedProcedure.query(async ({ ctx }) => { const profile = await requirePermission(ctx, "workers:read"); const rows = await db.listWorkers(); return profile.fullAccess || !profile.scopeUnits.length ? rows : rows.filter(row => row.unit && profile.scopeUnits.includes(row.unit)); }),
      teams: protectedProcedure.query(async ({ ctx }) => {
        const profile = await requirePermission(ctx, "workers:read");
        const [rows, account] = await Promise.all([db.getWorkforceTeamSummary(), db.getInternalAccountByUserId(ctx.user.id)]);
        const scopedRows = profile.fullAccess || !profile.scopeUnits.length ? rows : rows.filter(row => profile.scopeUnits.includes(row.unit));
        const expandedUnits = account?.groupType === "production" ? JSON.parse(account.scopeUnits) as string[] : [];
        return {
          expandedUnits,
          teams: scopedRows.map(team => ({ ...team, totalWorkerCount: team.workers.length, workers: expandedUnits.includes(team.unit) ? team.workers : team.workers.slice(0, 3) })),
        };
      }),
      management: protectedProcedure.query(async ({ ctx }) => { await requirePermission(ctx, "workers:read"); return db.getManagementGroupSummary(); }),
      monthlyHistory: protectedProcedure.query(async ({ ctx }) => {
        const profile = await requirePermission(ctx, "workers:read");
        if (!profile.fullAccess && profile.scopeUnits.length) return [];
        return db.getWorkforceMonthlySnapshots();
      }),
      monthlyHistoryByTeam: protectedProcedure.query(async ({ ctx }) => {
        const profile = await requirePermission(ctx, "workers:read");
        const snapshots = await db.getWorkforceTeamMonthlySnapshots();
        if (profile.fullAccess || !profile.scopeUnits.length) return snapshots;
        return snapshots.filter(snapshot => profile.scopeUnits.includes(snapshot.unit));
      }),
      areaDistribution: protectedProcedure.input(z.object({ gardenType: z.enum(["A", "B", "C"]).optional() }).optional()).query(async ({ input, ctx }) => {
        const profile = await requirePermission(ctx, "workers:read");
        return db.getWorkerPlotAreaDistribution(profile.fullAccess || !profile.scopeUnits.length ? undefined : profile.scopeUnits, input?.gardenType);
      }),
      captureMonthlySnapshot: adminProcedure.mutation(async ({ ctx }) => {
        const snapshot = await db.captureWorkforceMonthlySnapshot(getVietnamMonthKey(), ctx.user.id);
        await db.logActivity(ctx.user.id, { eventType: "workforce.monthly_snapshot.capture", entityType: "workforce_monthly_snapshot", entityId: snapshot.month, summary: `Chốt số liệu nhân công ${snapshot.month}`, metadata: snapshot });
        return snapshot;
      }),
      targets: router({
        list: protectedProcedure.query(async ({ ctx }) => { await requirePermission(ctx, "workers:read"); return db.listWorkforceTeamTargets(); }),
        save: adminProcedure.input(z.object({ targets: z.array(z.object({ unit: requiredText("Đội", 120), staffingTarget: z.coerce.number().int().min(0).max(10000) })).min(1).max(100) })).mutation(async ({ input, ctx }) => {
          await db.saveWorkforceTeamTargets(input.targets, ctx.user.id);
          await db.logActivity(ctx.user.id, { eventType: "worker.target.update", entityType: "workforce_team_target", summary: "Cập nhật chỉ tiêu biên chế theo đội", metadata: { targets: input.targets } });
          return { success: true };
        }),
      }),
      managementTargets: router({
        save: adminProcedure.input(z.object({ targets: z.array(z.object({ groupType: z.enum(["board", "functional", "production"]), staffingTarget: z.coerce.number().int().min(0).max(10000) })).length(3) })).mutation(async ({ input, ctx }) => {
          await db.saveManagementGroupTargets(input.targets, ctx.user.id);
          await db.logActivity(ctx.user.id, { eventType: "management.target.update", entityType: "management_group_target", summary: "Cập nhật biên chế đội ngũ quản lý", metadata: { targets: input.targets } });
          return { success: true };
        }),
      }),
      create: adminProcedure.input(z.object({
        name: requiredText("Tên phiên âm", 160),
        employeeCode: z.string().trim().max(64).optional().nullable(),
        unit: requiredText("Đội", 120),
        phoneticName: requiredText("Tên phiên âm", 160),
        gender: z.enum(["male", "female"]).default("male"),
        phone: z.string().max(32).optional().nullable(),
        roleTitle: requiredText("Vai trò", 120),
        status: z.enum(["active", "inactive"]),
        note: z.string().max(1000).optional().nullable(),
      })).mutation(async ({ input, ctx }) => {
        await db.createWorker(input, ctx.user.id);
        await db.logActivity(ctx.user.id, { eventType: "worker.create", entityType: "worker", summary: `Tạo nhân công ${input.name}` });
        return { success: true };
      }),
    }),
    assignments: router({
      list: protectedProcedure.query(async ({ ctx }) => filterByScope(await db.listAssignments(), await requirePermission(ctx, "care:read"))),
      create: protectedProcedure.input(z.object({
        workerId: z.number().int().positive(),
        plotId: z.number().int().positive(),
        task: requiredText("Công việc", 220),
        assignmentDate: dateInput,
        status: z.enum(["planned", "in_progress", "completed"]),
        note: z.string().max(1000).optional().nullable(),
      })).mutation(async ({ input, ctx }) => {
        const plot = await db.getPlotById(input.plotId); if (!plot) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy vườn" }); await requirePermission(ctx, "care:write", plot.unit);
        await db.createAssignment(input, ctx.user.id);
        await db.logActivity(ctx.user.id, { eventType: "assignment.create", entityType: "assignment", entityId: input.plotId, summary: `Phân công ${input.task}` });
        return { success: true };
      }),
    }),
  }),
  reports: router({
    progress: protectedProcedure.input(z.object({ periodLabel: requiredText("Đợt", 80) })).query(async ({ input, ctx }) => filterByScope(await db.getProgressReport(input.periodLabel), await requirePermission(ctx, "reports:read"))),
  }),
});
