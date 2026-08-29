import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLogs,
  careActivities,
  dataBackups,
  dataBackupSchedule,
  dailyCareRecords,
  InsertUser,
  internalAccounts,
  latexExports,
  latexImports,
  managementGroupTargets,
  plantationPlots,
  plotGardenAllocations,
  plotLatexProductions,
  plotProductionPeriodLocks,
  teamLatexExports,
  teamLatexImports,
  userDashboardPreferences,
  users,
  workers,
  workforceAssignments,
  workerPlotAllocations,
  workforceMonthlySnapshots,
  workforceSnapshotSchedule,
  workforceTeamMonthlySnapshots,
  workforceTeamTargets,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { storageGetSignedUrl, storagePut } from "./storage";
import * as XLSX from "xlsx";
import { calculateLatexTotals } from "./rubberMath";
import { aggregateWarehouseLoss } from "./warehouseLossMath";
import { summarizeWorkforceByTeam, WorkforceTeamTarget } from "./workforceSummary";
import { comparePeriodLabel, TEAM_ORDER } from "../shared/teamOrder";

const MANAGEMENT_GROUPS = [
  { groupType: "board" as const, label: "Ban Giám đốc" },
  { groupType: "functional" as const, label: "Cơ quan chức năng" },
  { groupType: "production" as const, label: "Đội sản xuất" },
];

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]; }

export type TeamOverviewColumns = { area: boolean; plots: boolean; workforce: boolean; production: boolean };
const defaultTeamOverviewColumns: TeamOverviewColumns = { area: true, plots: true, workforce: true, production: true };
export async function getDashboardPreferences(userId: number) { const db = await getDb(); if (!db) return { teamOverviewColumns: defaultTeamOverviewColumns }; const row = (await db.select().from(userDashboardPreferences).where(eq(userDashboardPreferences.userId, userId)).limit(1))[0]; if (!row) return { teamOverviewColumns: defaultTeamOverviewColumns }; try { return { teamOverviewColumns: { ...defaultTeamOverviewColumns, ...(JSON.parse(row.teamOverviewColumns) as Partial<TeamOverviewColumns>) } }; } catch { return { teamOverviewColumns: defaultTeamOverviewColumns }; } }
export async function saveDashboardPreferences(userId: number, teamOverviewColumns: TeamOverviewColumns) { const db = await getDb(); if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng"); await db.insert(userDashboardPreferences).values({ userId, teamOverviewColumns: JSON.stringify(teamOverviewColumns) }).onDuplicateKeyUpdate({ set: { teamOverviewColumns: JSON.stringify(teamOverviewColumns) } }); return { teamOverviewColumns }; }

export type InternalAccountInput = { username: string; password: string; displayName: string; groupType: "board" | "functional" | "production"; roleCode: string; scopeUnits: string[]; permissions: string[]; active?: boolean };
export async function getInternalAccountByUsername(username: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(internalAccounts).where(eq(internalAccounts.username, username)).limit(1))[0]; }
export async function getInternalAccountByUserId(userId: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(internalAccounts).where(eq(internalAccounts.userId, userId)).limit(1))[0]; }
export async function listInternalAccounts() { const db = await getDb(); if (!db) return []; const rows = await db.select().from(internalAccounts).orderBy(asc(internalAccounts.groupType), asc(internalAccounts.displayName)); return rows.map(row => ({ ...row, scopeUnits: JSON.parse(row.scopeUnits) as string[], permissions: JSON.parse(row.permissionProfile) as string[], passwordHash: undefined })); }
export async function createInternalAccount(input: InternalAccountInput, hash: string, creatorId: number) { const db = await getDb(); if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng"); const role = input.roleCode === "system_admin" ? "admin" as const : "user" as const; const result = await db.insert(users).values({ openId: `local:${input.username}`, name: input.displayName, loginMethod: "internal", role }).$returningId(); const userId = result[0]!.id; await db.insert(internalAccounts).values({ userId, username: input.username, passwordHash: hash, displayName: input.displayName, groupType: input.groupType, roleCode: input.roleCode, scopeUnits: JSON.stringify(input.scopeUnits), permissionProfile: JSON.stringify(input.permissions), isActive: input.active === false ? 0 : 1, createdBy: creatorId }); return { userId }; }
export async function updateInternalAccount(id: number, values: Partial<Omit<InternalAccountInput, "password">> & { passwordHash?: string; active?: boolean }) { const db = await getDb(); if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng"); const update: Record<string, unknown> = {}; if (values.displayName !== undefined) update.displayName = values.displayName; if (values.groupType !== undefined) update.groupType = values.groupType; if (values.roleCode !== undefined) update.roleCode = values.roleCode; if (values.scopeUnits !== undefined) update.scopeUnits = JSON.stringify(values.scopeUnits); if (values.permissions !== undefined) update.permissionProfile = JSON.stringify(values.permissions); if (values.passwordHash !== undefined) update.passwordHash = values.passwordHash; if (values.active !== undefined) update.isActive = values.active ? 1 : 0; await db.update(internalAccounts).set(update).where(eq(internalAccounts.id, id)); }

export type ActivityLogInput = { eventType: string; entityType: string; entityId?: string | number | null; summary: string; metadata?: Record<string, unknown> | null };
export async function logActivity(userId: number, input: ActivityLogInput) { const db = await getDb(); if (!db) return; const [account, user] = await Promise.all([getInternalAccountByUserId(userId), getUserById(userId)]); await db.insert(activityLogs).values({ userId, username: account?.username ?? null, displayName: account?.displayName ?? user?.name ?? null, eventType: input.eventType, entityType: input.entityType, entityId: input.entityId == null ? null : String(input.entityId), summary: input.summary, metadata: input.metadata ? JSON.stringify(input.metadata) : null }); }
export async function listActivityLogs(filters?: { userId?: number; username?: string; eventType?: string; startDate?: string; endDate?: string; limit?: number }) { const db = await getDb(); if (!db) return []; const rows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(Math.min(filters?.limit ?? 300, 500)); const start = filters?.startDate ? new Date(`${filters.startDate}T00:00:00.000Z`) : null; const end = filters?.endDate ? new Date(`${filters.endDate}T23:59:59.999Z`) : null; return rows.filter(row => (filters?.userId == null || row.userId === filters.userId) && (!filters?.username || row.username === filters.username) && (!filters?.eventType || row.eventType === filters.eventType) && (!start || row.createdAt >= start) && (!end || row.createdAt <= end)).map(row => ({ ...row, metadata: row.metadata ? JSON.parse(row.metadata) : null })); }
export async function listActivityActors() { const db = await getDb(); if (!db) return []; const rows = await db.select({ username: internalAccounts.username, displayName: internalAccounts.displayName }).from(internalAccounts).orderBy(asc(internalAccounts.displayName)); return rows; }
export async function listPlotAllocationHistory(unit?: string) { const db = await getDb(); if (!db) return [];   const rows = await db.select().from(activityLogs).where(inArray(activityLogs.eventType, ["plot.garden_type.bulk_assign", "plot.garden_portion.allocate"])).orderBy(desc(activityLogs.createdAt)).limit(200); return rows.map(row => ({ ...row, metadata: row.metadata ? JSON.parse(row.metadata) : null })).filter(row => !unit || (row.metadata as { unit?: string } | null)?.unit === unit); }

const numberValue = (value: unknown) => Number(value ?? 0);
const asQuantity = (value: number) => value.toFixed(2);
const asArea = (value: number) => value.toFixed(3);

export type PlotPayload = {
  code: string;
  name: string;
  unit: string;
  gardenType?: "A" | "B" | "C" | null;
  tappingDay?: number | null;
  rowStart?: number | null;
  rowEnd?: number | null;
  tappingTrees?: number | null;
  areaHa: number;
  note?: string | null;
};

export async function listPlots() {
  const db = await getDb();
  if (!db) return [];
  const [rows, allocationRows] = await Promise.all([
    db.select().from(plantationPlots).orderBy(asc(plantationPlots.unit), asc(plantationPlots.code)),
    db.select().from(plotGardenAllocations).orderBy(asc(plotGardenAllocations.plotId), asc(plotGardenAllocations.gardenType)),
  ]);
  const allocationsByPlot = new Map<number, typeof allocationRows>();
  allocationRows.forEach(row => {
    const list = allocationsByPlot.get(row.plotId) ?? [];
    list.push(row);
    allocationsByPlot.set(row.plotId, list);
  });
  return rows.map(row => {
    const allocations = allocationsByPlot.get(row.id) ?? [];
    const allocatedAreaHa = allocations.reduce((sum, allocation) => sum + numberValue(allocation.areaHa), 0);
    const allocatedTappingTrees = allocations.reduce((sum, allocation) => sum + Number(allocation.tappingTrees ?? 0), 0);
    const totalAreaHa = numberValue(row.areaHa);
    const totalTappingTrees = row.tappingTrees == null ? null : Number(row.tappingTrees);
    return {
      ...row,
      areaHa: totalAreaHa,
      tappingTrees: totalTappingTrees,
      gardenAllocations: allocations.map(allocation => ({ ...allocation, areaHa: numberValue(allocation.areaHa), tappingTrees: Number(allocation.tappingTrees ?? 0) })),
      allocatedAreaHa,
      allocatedTappingTrees,
      remainingAreaHa: Math.max(0, totalAreaHa - allocatedAreaHa),
      remainingTappingTrees: totalTappingTrees == null ? null : Math.max(0, totalTappingTrees - allocatedTappingTrees),
    };
  });
}

export async function allocatePlotGardenPortion(input: { plotId: number; gardenType: "A" | "B" | "C"; areaHa: number; tappingTrees: number }, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const plot = (await db.select().from(plantationPlots).where(eq(plantationPlots.id, input.plotId)).limit(1))[0];
  if (!plot) throw new Error("Không tìm thấy Lô");
  const allocations = await db.select().from(plotGardenAllocations).where(eq(plotGardenAllocations.plotId, input.plotId));
  const allocatedAreaHa = allocations.reduce((sum, allocation) => sum + numberValue(allocation.areaHa), 0);
  const allocatedTappingTrees = allocations.reduce((sum, allocation) => sum + Number(allocation.tappingTrees ?? 0), 0);
  const totalAreaHa = numberValue(plot.areaHa);
  const totalTappingTrees = plot.tappingTrees == null ? null : Number(plot.tappingTrees);
  const nextAreaHa = allocatedAreaHa + input.areaHa;
  const nextTappingTrees = allocatedTappingTrees + input.tappingTrees;
  if (nextAreaHa > totalAreaHa + 0.0005) throw new Error(`Diện tích phân bổ vượt quá diện tích còn lại của Lô (${Math.max(0, totalAreaHa - allocatedAreaHa).toFixed(3)} ha)`);
  if (totalTappingTrees == null) throw new Error("Lô chưa có tổng số cây cạo; hãy cập nhật số cây cạo của Lô trước");
  if (nextTappingTrees > totalTappingTrees) throw new Error(`Số cây cạo phân bổ vượt quá số cây còn lại của Lô (${Math.max(0, totalTappingTrees - allocatedTappingTrees)} cây)`);
  const existing = allocations.find(allocation => allocation.gardenType === input.gardenType);
  if (existing) {
    await db.update(plotGardenAllocations).set({ areaHa: asArea(numberValue(existing.areaHa) + input.areaHa), tappingTrees: Number(existing.tappingTrees ?? 0) + input.tappingTrees, createdBy: userId }).where(eq(plotGardenAllocations.id, existing.id));
  } else {
    await db.insert(plotGardenAllocations).values({ plotId: input.plotId, gardenType: input.gardenType, areaHa: asArea(input.areaHa), tappingTrees: input.tappingTrees, createdBy: userId });
  }
  return { remainingAreaHa: Math.max(0, totalAreaHa - nextAreaHa), remainingTappingTrees: Math.max(0, totalTappingTrees - nextTappingTrees), allocatedAreaHa: nextAreaHa, allocatedTappingTrees: nextTappingTrees };
}

export async function getPlotById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(plantationPlots).where(eq(plantationPlots.id, id)).limit(1))[0]; }

export async function createPlot(input: PlotPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(plantationPlots).values({
    ...input,
    areaHa: asArea(input.areaHa),
    note: input.note?.trim() || null,
    createdBy: userId,
  });
}

export async function updatePlot(id: number, input: PlotPayload) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.update(plantationPlots).set({
    ...input,
    areaHa: asArea(input.areaHa),
    note: input.note?.trim() || null,
  }).where(eq(plantationPlots.id, id));
}

export async function updatePlotGardenType(plotIds: number[], gardenType: "A" | "B" | "C", details?: { rowStart?: number; rowEnd?: number; areaHa?: number; tappingTrees?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const uniqueIds = Array.from(new Set(plotIds));
  if (!uniqueIds.length) return 0;
  const values: Record<string, unknown> = { gardenType };
  if (details?.rowStart !== undefined) values.rowStart = details.rowStart;
  if (details?.rowEnd !== undefined) values.rowEnd = details.rowEnd;
  if (details?.areaHa !== undefined) values.areaHa = asArea(details.areaHa);
  if (details?.tappingTrees !== undefined) values.tappingTrees = details.tappingTrees;
  await db.update(plantationPlots).set(values).where(inArray(plantationPlots.id, uniqueIds));
  return uniqueIds.length;
}

export async function updatePlotMap(id: number, mapFileKey: string | null, mapUrl: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.update(plantationPlots).set({
    mapFileKey,
    mapUrl,
    mapUpdatedAt: mapUrl ? new Date() : null,
  }).where(eq(plantationPlots.id, id));
}

export type ExcelPlotPayload = PlotPayload & { plantedYear?: number | null; cultivar?: string | null; inventoryPits?: number | null; inventoryTrees?: number | null; tappingTrees?: number | null; tappingDensity?: number | null; plotRank?: string | null };

export async function bulkUpsertExcelPlots(rows: ExcelPlotPayload[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const row of rows) await db.insert(plantationPlots).values({ ...row, gardenType: row.gardenType ?? null, tappingDay: row.tappingDay ?? null, rowStart: row.rowStart ?? null, rowEnd: row.rowEnd ?? null, areaHa: asArea(row.areaHa), note: row.note?.trim() || null, cultivar: row.cultivar?.trim() || null, plantedYear: row.plantedYear ?? null, inventoryPits: row.inventoryPits ?? null, inventoryTrees: row.inventoryTrees ?? null, tappingTrees: row.tappingTrees ?? null, tappingDensity: row.tappingDensity == null ? null : asQuantity(row.tappingDensity), plotRank: row.plotRank?.trim() || null, createdBy: userId }).onDuplicateKeyUpdate({ set: { name: row.name, unit: row.unit, gardenType: row.gardenType ?? null, tappingDay: row.tappingDay ?? null, rowStart: row.rowStart ?? null, rowEnd: row.rowEnd ?? null, areaHa: asArea(row.areaHa), note: row.note?.trim() || null, cultivar: row.cultivar?.trim() || null, plantedYear: row.plantedYear ?? null, inventoryPits: row.inventoryPits ?? null, inventoryTrees: row.inventoryTrees ?? null, tappingTrees: row.tappingTrees ?? null, tappingDensity: row.tappingDensity == null ? null : asQuantity(row.tappingDensity), plotRank: row.plotRank?.trim() || null } });
}

export type ExcelWorkerPayload = { unit: string; name: string; employeeCode?: string | null; phoneticName?: string | null; gender: "male" | "female"; status: "active" | "inactive"; roleTitle?: string; note?: string | null };

export async function bulkUpsertExcelWorkers(rows: ExcelWorkerPayload[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const row of rows) { const roleTitle = row.roleTitle?.trim() || "Công nhân khai thác"; await db.insert(workers).values({ name: row.name, employeeCode: row.employeeCode?.trim() || null, unit: row.unit, phoneticName: row.phoneticName?.trim() || null, gender: row.gender, roleTitle, status: row.status, note: row.note?.trim() || null, createdBy: userId }).onDuplicateKeyUpdate({ set: { employeeCode: row.employeeCode?.trim() || null, phoneticName: row.phoneticName?.trim() || null, gender: row.gender, roleTitle, status: row.status, note: row.note?.trim() || null } }); }
}

export type TeamImportPayload = { unit: string; gardenName: string; periodLabel: string; recordDate: Date; frozenLatex: number; latexThread: number };
export type TeamExportPayload = { unit: string; periodLabel: string; recordDate: Date; frozenContaminatedLatex: number; latexThread: number; note?: string | null };

export async function bulkUpsertTeamImports(rows: TeamImportPayload[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const row of rows) await db.insert(teamLatexImports).values({ ...row, frozenLatex: asQuantity(row.frozenLatex), latexThread: asQuantity(row.latexThread), createdBy: userId }).onDuplicateKeyUpdate({ set: { periodLabel: row.periodLabel, frozenLatex: asQuantity(row.frozenLatex), latexThread: asQuantity(row.latexThread) } });
}

export async function bulkUpsertTeamExports(rows: TeamExportPayload[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const row of rows) await db.insert(teamLatexExports).values({ ...row, note: row.note?.trim() || null, frozenContaminatedLatex: asQuantity(row.frozenContaminatedLatex), latexThread: asQuantity(row.latexThread), createdBy: userId }).onDuplicateKeyUpdate({ set: { periodLabel: row.periodLabel, frozenContaminatedLatex: asQuantity(row.frozenContaminatedLatex), latexThread: asQuantity(row.latexThread), note: row.note?.trim() || null, createdBy: userId } });
}

export async function getExcelDataSummary() {
  const db = await getDb();
  if (!db) return { plots: 0, workers: 0, teamImports: 0, teamExports: 0, totalImport: 0, totalExport: 0 };
  const [plots, workerRows, imports, exports] = await Promise.all([db.select().from(plantationPlots), db.select().from(workers), db.select().from(teamLatexImports), db.select().from(teamLatexExports)]);
  return { plots: plots.length, workers: workerRows.length, teamImports: imports.length, teamExports: exports.length, totalImport: imports.reduce((sum, row) => sum + numberValue(row.frozenLatex) + numberValue(row.latexThread), 0), totalExport: exports.reduce((sum, row) => sum + numberValue(row.frozenContaminatedLatex) + numberValue(row.latexThread), 0) };
}

export async function listTeamImports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(teamLatexImports).orderBy(desc(teamLatexImports.recordDate));
  return rows.map(row => ({ ...row, frozenLatex: numberValue(row.frozenLatex), latexThread: numberValue(row.latexThread), totalImport: numberValue(row.frozenLatex) + numberValue(row.latexThread) }));
}

export async function listTeamExports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ exportRow: teamLatexExports, accountName: internalAccounts.displayName, userName: users.name }).from(teamLatexExports).leftJoin(internalAccounts, eq(teamLatexExports.createdBy, internalAccounts.userId)).leftJoin(users, eq(teamLatexExports.createdBy, users.id)).orderBy(desc(teamLatexExports.recordDate));
  return rows.map(({ exportRow, accountName, userName }) => ({ ...exportRow, preparedBy: accountName ?? userName ?? null, frozenContaminatedLatex: numberValue(exportRow.frozenContaminatedLatex), latexThread: numberValue(exportRow.latexThread), totalExport: numberValue(exportRow.frozenContaminatedLatex) + numberValue(exportRow.latexThread) }));
}

export type PlotLatexProductionPayload = { plotId: number; recordDate: Date; frozenContaminatedLatex: number; dryRubber: number; note?: string | null; source?: "Nhập tay" | "Nhập nhanh" | "Excel import" };
const normalizeOperatingDate = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
const plotProductionPeriod = (date: Date) => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 });
const plotProductionPeriodLabel = ({ year, month }: { year: number; month: number }) => `Tháng ${month}/${year}`;

export async function listPlotProductionPeriodLocks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plotProductionPeriodLocks).orderBy(desc(plotProductionPeriodLocks.year), desc(plotProductionPeriodLocks.month));
}

export async function lockPlotProductionPeriod(year: number, month: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const lockedAt = new Date();
  await db.insert(plotProductionPeriodLocks).values({ year, month, lockedBy: userId, lockedAt }).onDuplicateKeyUpdate({ set: { lockedBy: userId, lockedAt } });
  return { year, month, lockedBy: userId, lockedAt };
}

export async function unlockPlotProductionPeriod(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.delete(plotProductionPeriodLocks).where(and(eq(plotProductionPeriodLocks.year, year), eq(plotProductionPeriodLocks.month, month)));
}

export async function assertPlotProductionPeriodsUnlocked(dates: Date[]) {
  const periods = new Map(dates.map(date => { const period = plotProductionPeriod(date); return [`${period.year}-${period.month}`, period] as const; }));
  if (!periods.size) return;
  const locks = await listPlotProductionPeriodLocks();
  const locked = locks.find(lock => periods.has(`${lock.year}-${lock.month}`));
  if (locked) throw new Error(`${plotProductionPeriodLabel(locked)} đã chốt, không thể nhập hoặc chỉnh sửa sản lượng.`);
}

export async function savePlotLatexProduction(input: PlotLatexProductionPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await assertPlotProductionPeriodsUnlocked([input.recordDate]);
  const values = { ...input, recordDate: normalizeOperatingDate(input.recordDate), frozenContaminatedLatex: asQuantity(input.frozenContaminatedLatex), dryRubber: asQuantity(input.dryRubber), note: input.note?.trim() || null, source: input.source ?? "Nhập tay", createdBy: userId };
  await db.insert(plotLatexProductions).values(values).onDuplicateKeyUpdate({ set: { frozenContaminatedLatex: values.frozenContaminatedLatex, dryRubber: values.dryRubber, note: values.note, source: values.source, createdBy: userId } });
}

export async function bulkUpsertPlotLatexProductions(rows: PlotLatexProductionPayload[], userId: number, source: "Nhập nhanh" | "Excel import" = "Excel import") {
  await assertPlotProductionPeriodsUnlocked(rows.map(row => row.recordDate));
  for (const row of rows) await savePlotLatexProduction({ ...row, source }, userId);
}

export async function listPlotLatexProductions() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ entry: plotLatexProductions, plot: plantationPlots }).from(plotLatexProductions).innerJoin(plantationPlots, eq(plotLatexProductions.plotId, plantationPlots.id)).orderBy(desc(plotLatexProductions.recordDate), asc(plantationPlots.unit), asc(plantationPlots.code));
  return rows.map(({ entry, plot }) => ({ ...entry, unit: plot.unit, plotCode: plot.code, plotName: plot.name, plantedYear: plot.plantedYear, areaHa: numberValue(plot.areaHa), frozenContaminatedLatex: numberValue(entry.frozenContaminatedLatex), dryRubber: numberValue(entry.dryRubber) }));
}

export async function getTeamLatexBalance(unit: string, periodLabel: string) {
  const [imports, exports] = await Promise.all([listTeamImports(), listTeamExports()]);
  const totalImport = imports.filter(row => row.unit === unit && row.periodLabel === periodLabel).reduce((sum, row) => sum + row.totalImport, 0);
  const totalExport = exports.filter(row => row.unit === unit && row.periodLabel === periodLabel).reduce((sum, row) => sum + row.totalExport, 0);
  return { unit, periodLabel, totalImport, totalExport, warehouseLoss: Math.max(0, totalImport - totalExport), exceedsImport: Math.max(0, totalExport - totalImport) };
}

export async function getWarehouseLossByTeam(periodLabel?: string, monthLabel?: string) {
  const [imports, exports] = await Promise.all([listTeamImports(), listTeamExports()]);
  return aggregateWarehouseLoss(imports, exports, periodLabel, monthLabel);
}

export type DailyCarePayload = { category: "tapping" | "reinforcement" | "care" | "treatment"; activityDate: Date; unit: string; gardenName: string; plotId?: number | null; areaHa?: number | null; tappingSection?: number | null; planQuantity: number; actualQuantity: number; cumulativeQuantity?: number; metricUnit: string; completedGardens?: number | null; pendingGardens?: number | null; partialGardens?: number | null; nextGarden?: string | null; workContent?: string | null; note?: string | null };

export async function saveDailyCareRecord(input: DailyCarePayload, userId: number) {
  const db = await getDb(); if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const planQuantity = asQuantity(input.planQuantity); const actualQuantity = asQuantity(input.actualQuantity); const cumulativeQuantity = asQuantity(input.cumulativeQuantity ?? input.actualQuantity); const progressPercent = input.planQuantity > 0 ? asQuantity((input.actualQuantity / input.planQuantity) * 100) : "0.00";
  const values = { ...input, plotId: input.plotId ?? null, areaHa: input.areaHa == null ? null : asQuantity(input.areaHa), tappingSection: input.tappingSection ?? null, planQuantity, actualQuantity, cumulativeQuantity, progressPercent, completedGardens: input.completedGardens ?? null, pendingGardens: input.pendingGardens ?? null, partialGardens: input.partialGardens ?? null, nextGarden: input.nextGarden?.trim() || null, workContent: input.workContent?.trim() || null, note: input.note?.trim() || null, createdBy: userId };
  await db.insert(dailyCareRecords).values(values).onDuplicateKeyUpdate({ set: values });
}

export async function listDailyCareRecords(category?: DailyCarePayload["category"]) {
  const db = await getDb(); if (!db) return [];
  const rows = category ? await db.select().from(dailyCareRecords).where(eq(dailyCareRecords.category, category)).orderBy(desc(dailyCareRecords.activityDate)) : await db.select().from(dailyCareRecords).orderBy(desc(dailyCareRecords.activityDate));
  return rows.map(row => ({ ...row, areaHa: row.areaHa == null ? null : numberValue(row.areaHa), planQuantity: numberValue(row.planQuantity), actualQuantity: numberValue(row.actualQuantity), cumulativeQuantity: numberValue(row.cumulativeQuantity), progressPercent: row.progressPercent == null ? 0 : numberValue(row.progressPercent) }));
}

export async function getProductionChangeReport() {
  const [imports, exports] = await Promise.all([listTeamImports(), listTeamExports()]);
  const exportByTeamPeriod = new Map(exports.map(row => [`${row.unit}::${row.periodLabel}`, row.totalExport]));
  const groups = new Map<string, { unit: string; gardenName: string; periodLabel: string; monthLabel: string; recordDate: Date; totalImport: number }>();
  imports.forEach(row => { const key = `${row.unit}::${row.gardenName}::${row.periodLabel}`; const value = groups.get(key) ?? { unit: row.unit, gardenName: row.gardenName, periodLabel: row.periodLabel, monthLabel: `${row.recordDate.getUTCMonth() + 1}/${row.recordDate.getUTCFullYear()}`, recordDate: row.recordDate, totalImport: 0 }; value.totalImport += row.totalImport; if (row.recordDate > value.recordDate) value.recordDate = row.recordDate; groups.set(key, value); });
  const byGarden = new Map<string, Array<(typeof groups extends Map<string, infer T> ? T : never)>>();
  Array.from(groups.values()).forEach(row => { const key = `${row.unit}::${row.gardenName}`; const list = byGarden.get(key) ?? []; list.push(row); byGarden.set(key, list); });
  const rows = Array.from(byGarden.values()).flatMap(list => list.sort((a, b) => a.recordDate.getTime() - b.recordDate.getTime()).map((row, index) => { const previous = list[index - 1]; const changeKg = previous ? row.totalImport - previous.totalImport : 0; return { ...row, totalExport: exportByTeamPeriod.get(`${row.unit}::${row.periodLabel}`) ?? 0, changeKg, changePercent: previous?.totalImport ? (changeKg / previous.totalImport) * 100 : 0 }; })).sort((a, b) => b.recordDate.getTime() - a.recordDate.getTime() || a.unit.localeCompare(b.unit, "vi"));
  return { rows, periods: Array.from(new Set(rows.map(row => row.periodLabel))), months: Array.from(new Set(rows.map(row => row.monthLabel))) };
}

export async function removePlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const [imports, exports, care, assignments] = await Promise.all([
    db.select({ id: latexImports.id }).from(latexImports).where(eq(latexImports.plotId, id)).limit(1),
    db.select({ id: latexExports.id }).from(latexExports).where(eq(latexExports.plotId, id)).limit(1),
    db.select({ id: careActivities.id }).from(careActivities).where(eq(careActivities.plotId, id)).limit(1),
    db.select({ id: workforceAssignments.id }).from(workforceAssignments).where(eq(workforceAssignments.plotId, id)).limit(1),
  ]);
  if (imports.length || exports.length || care.length || assignments.length) {
    throw new Error("Không thể xóa vườn đang có dữ liệu vận hành");
  }
  await db.delete(plotGardenAllocations).where(eq(plotGardenAllocations.plotId, id));
  await db.delete(plantationPlots).where(eq(plantationPlots.id, id));
}

export type ImportPayload = {
  plotId: number;
  recordDate: Date;
  periodLabel: string;
  frozenLatex: number;
  latexThread: number;
  note?: string | null;
};

export async function saveLatexImport(input: ImportPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const values = {
    ...input,
    frozenLatex: asQuantity(input.frozenLatex),
    latexThread: asQuantity(input.latexThread),
    note: input.note?.trim() || null,
    createdBy: userId,
  };
  await db.insert(latexImports).values(values).onDuplicateKeyUpdate({
    set: {
      periodLabel: values.periodLabel,
      frozenLatex: values.frozenLatex,
      latexThread: values.latexThread,
      note: values.note,
    },
  });
}

export async function listLatexImports(periodLabel?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({
    id: latexImports.id,
    plotId: plantationPlots.id,
    plotCode: plantationPlots.code,
    plotName: plantationPlots.name,
    unit: plantationPlots.unit,
    recordDate: latexImports.recordDate,
    periodLabel: latexImports.periodLabel,
    frozenLatex: latexImports.frozenLatex,
    latexThread: latexImports.latexThread,
    note: latexImports.note,
  }).from(latexImports).innerJoin(plantationPlots, eq(latexImports.plotId, plantationPlots.id));
  const rows = periodLabel
    ? await query.where(eq(latexImports.periodLabel, periodLabel)).orderBy(desc(latexImports.recordDate))
    : await query.orderBy(desc(latexImports.recordDate));
  return rows.map(row => ({
    ...row,
    frozenLatex: numberValue(row.frozenLatex),
    latexThread: numberValue(row.latexThread),
    totalImport: numberValue(row.frozenLatex) + numberValue(row.latexThread),
  }));
}

export type ExportPayload = {
  plotId: number;
  periodLabel: string;
  recordDate: Date;
  frozenContaminatedLatex: number;
  latexThread: number;
  note?: string | null;
};

export async function createLatexExport(input: ExportPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(latexExports).values({
    ...input,
    frozenContaminatedLatex: asQuantity(input.frozenContaminatedLatex),
    latexThread: asQuantity(input.latexThread),
    note: input.note?.trim() || null,
    createdBy: userId,
  });
}

export async function listLatexExports(periodLabel?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({
    id: latexExports.id,
    plotId: plantationPlots.id,
    plotCode: plantationPlots.code,
    plotName: plantationPlots.name,
    unit: plantationPlots.unit,
    periodLabel: latexExports.periodLabel,
    recordDate: latexExports.recordDate,
    frozenContaminatedLatex: latexExports.frozenContaminatedLatex,
    latexThread: latexExports.latexThread,
    note: latexExports.note,
  }).from(latexExports).innerJoin(plantationPlots, eq(latexExports.plotId, plantationPlots.id));
  const rows = periodLabel
    ? await query.where(eq(latexExports.periodLabel, periodLabel)).orderBy(desc(latexExports.recordDate))
    : await query.orderBy(desc(latexExports.recordDate));
  return rows.map(row => ({
    ...row,
    frozenContaminatedLatex: numberValue(row.frozenContaminatedLatex),
    latexThread: numberValue(row.latexThread),
    totalExport: numberValue(row.frozenContaminatedLatex) + numberValue(row.latexThread),
  }));
}

export type CarePayload = { plotId: number; activityDate: Date; description: string };

export async function createCareActivity(input: CarePayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(careActivities).values({ ...input, createdBy: userId });
}

export async function listCareActivities() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: careActivities.id,
    plotId: plantationPlots.id,
    plotCode: plantationPlots.code,
    plotName: plantationPlots.name,
    unit: plantationPlots.unit,
    activityDate: careActivities.activityDate,
    description: careActivities.description,
  }).from(careActivities).innerJoin(plantationPlots, eq(careActivities.plotId, plantationPlots.id)).orderBy(desc(careActivities.activityDate));
}

export type WorkerPayload = { name: string; employeeCode?: string | null; unit?: string | null; phoneticName?: string | null; gender?: "male" | "female"; phone?: string | null; roleTitle: string; status: "active" | "inactive"; note?: string | null };

export async function listWorkers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workers).orderBy(asc(workers.unit), asc(workers.phoneticName), asc(workers.name));
}

export async function listWorkforceTeamTargets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workforceTeamTargets).orderBy(asc(workforceTeamTargets.unit));
}

export async function saveWorkforceTeamTargets(targets: WorkforceTeamTarget[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const target of targets) {
    await db.insert(workforceTeamTargets).values({ unit: target.unit.trim(), staffingTarget: target.staffingTarget, updatedBy: userId }).onDuplicateKeyUpdate({ set: { staffingTarget: target.staffingTarget, updatedBy: userId } });
  }
}

export async function getWorkforceTeamSummary() {
  const [workerRows, targets] = await Promise.all([listWorkers(), listWorkforceTeamTargets()]);
  return summarizeWorkforceByTeam(workerRows, targets);
}

export async function getWorkforceMonthlySnapshots() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ month: workforceMonthlySnapshots.monthKey, activeCount: workforceMonthlySnapshots.activeCount, totalCount: workforceMonthlySnapshots.totalCount }).from(workforceMonthlySnapshots).orderBy(asc(workforceMonthlySnapshots.monthKey));
}

export async function getWorkforceTeamMonthlySnapshots() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ month: workforceTeamMonthlySnapshots.monthKey, unit: workforceTeamMonthlySnapshots.unit, activeCount: workforceTeamMonthlySnapshots.activeCount, totalCount: workforceTeamMonthlySnapshots.totalCount }).from(workforceTeamMonthlySnapshots).orderBy(asc(workforceTeamMonthlySnapshots.monthKey), asc(workforceTeamMonthlySnapshots.unit));
}

export async function captureWorkforceMonthlySnapshot(monthKey: string, userId: number) {
  const result = await captureWorkforceMonthlySnapshots(monthKey, userId);
  return result.overall;
}

export async function captureWorkforceMonthlySnapshots(monthKey: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const workerRows = await db.select({ unit: workers.unit, status: workers.status }).from(workers);
  const overall = { month: monthKey, activeCount: workerRows.filter(worker => worker.status === "active").length, totalCount: workerRows.length };
  const teams = TEAM_ORDER.map(unit => {
    const teamWorkers = workerRows.filter(worker => worker.unit === unit);
    return { month: monthKey, unit, activeCount: teamWorkers.filter(worker => worker.status === "active").length, totalCount: teamWorkers.length };
  });
  await db.insert(workforceMonthlySnapshots).values({ monthKey, activeCount: overall.activeCount, totalCount: overall.totalCount, updatedBy: userId }).onDuplicateKeyUpdate({ set: { activeCount: overall.activeCount, totalCount: overall.totalCount, updatedBy: userId } });
  for (const team of teams) {
    await db.insert(workforceTeamMonthlySnapshots).values({ monthKey, unit: team.unit, activeCount: team.activeCount, totalCount: team.totalCount, updatedBy: userId }).onDuplicateKeyUpdate({ set: { activeCount: team.activeCount, totalCount: team.totalCount, updatedBy: userId } });
  }
  return { overall, teams };
}

export async function getWorkforceSnapshotScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(workforceSnapshotSchedule).where(eq(workforceSnapshotSchedule.taskUid, taskUid)).limit(1))[0] ?? null;
}

export async function saveWorkforceSnapshotSchedule(taskUid: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(workforceSnapshotSchedule).values({ id: 1, taskUid, updatedBy: userId }).onDuplicateKeyUpdate({ set: { taskUid, updatedBy: userId } });
}

type DataBackupSource = "automatic" | "manual";

const backupSheet = (book: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) => {
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Trạng thái": "Chưa có dữ liệu" }]), name);
};

export async function createDataBackup(input: { backupKey: string; source: DataBackupSource; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const existing = (await db.select().from(dataBackups).where(eq(dataBackups.backupKey, input.backupKey)).limit(1))[0];
  if (existing) return { ...existing, reused: true };

  const [plots, workerRows, imports, exports, plotProductionRows, plotProductionLocks, careRows, allocationRows, activityRows, accountRows, monthlyRows, teamMonthlyRows] = await Promise.all([
    db.select().from(plantationPlots), db.select().from(workers), db.select().from(teamLatexImports), db.select().from(teamLatexExports), db.select().from(plotLatexProductions), db.select().from(plotProductionPeriodLocks), db.select().from(dailyCareRecords), db.select().from(workerPlotAllocations), db.select().from(activityLogs),
    db.select({ username: internalAccounts.username, displayName: internalAccounts.displayName, groupType: internalAccounts.groupType, roleCode: internalAccounts.roleCode, scopeUnits: internalAccounts.scopeUnits, permissionProfile: internalAccounts.permissionProfile, isActive: internalAccounts.isActive, createdAt: internalAccounts.createdAt, updatedAt: internalAccounts.updatedAt }).from(internalAccounts),
    db.select().from(workforceMonthlySnapshots), db.select().from(workforceTeamMonthlySnapshots),
  ]);
  const book = XLSX.utils.book_new();
  backupSheet(book, "Lô vườn", plots.map(row => ({ "Mã lô": row.code, "Tên lô": row.name, "Đội": row.unit, "Loại vườn": row.gardenType ?? "", "Diện tích (ha)": row.areaHa, "Từ hàng": row.rowStart ?? "", "Đến hàng": row.rowEnd ?? "", "Năm trồng": row.plantedYear ?? "", "Giống": row.cultivar ?? "", "Cây cạo": row.tappingTrees ?? "", "Ngày chỉ số": row.indicatorDate ?? "" })));
  backupSheet(book, "Nhân công", workerRows.map(row => ({ "Đội": row.unit ?? "", "Tên": row.name, "Mã số": row.employeeCode ?? "", "Tên phiên âm": row.phoneticName ?? "", "Chức danh": row.roleTitle, "Trạng thái": row.status })));
  backupSheet(book, "Nhập mủ đội", imports.map(row => ({ "Đội": row.unit, "Vườn": row.gardenName, "Đợt": row.periodLabel, "Ngày": row.recordDate, "Mủ đông tạp (kg)": row.frozenLatex, "Mủ dây (kg)": row.latexThread, "Nguồn": row.source })));
  backupSheet(book, "Xuất mủ đội", exports.map(row => ({ "Đội": row.unit, "Đợt": row.periodLabel, "Ngày": row.recordDate, "Mủ đông tạp (kg)": row.frozenContaminatedLatex, "Mủ dây (kg)": row.latexThread, "Nguồn": row.source })));
  backupSheet(book, "Khóa kỳ sản lượng lô", plotProductionLocks.map(row => ({ "Năm": row.year, "Tháng": row.month, "Người chốt": row.lockedBy, "Thời điểm chốt": row.lockedAt })));
  backupSheet(book, "Sản lượng theo lô", plotProductionRows.map(row => ({ "Mã lô": row.plotId, "Ngày": row.recordDate, "Mủ đông, tạp (kg)": row.frozenContaminatedLatex, "Quy khô (kg)": row.dryRubber, "Nguồn": row.source, "Ghi chú": row.note ?? "" })));
  backupSheet(book, "Theo dõi hằng ngày", careRows.map(row => ({ "Bảng": row.category, "Ngày": row.activityDate, "Đội": row.unit, "Vườn": row.gardenName ?? "", "KH": row.planQuantity, "TH": row.actualQuantity, "Lũy kế": row.cumulativeQuantity, "% hoàn thành": row.progressPercent ?? "", "Nội dung": row.workContent ?? "", "Ghi chú": row.note ?? "" })));
  backupSheet(book, "Phân công nhân công", allocationRows.map(row => ({ "Mã nhân công": row.workerId, "Mã lô": row.plotId, "Vườn A/B/C": row.gardenType, "Từ hàng": row.rowStart, "Đến hàng": row.rowEnd, "Diện tích (ha)": row.areaHa, "Ngày cập nhật": row.updatedAt })));
  backupSheet(book, "Snapshot nhân công", [...monthlyRows.map(row => ({ "Loại": "Tổng", "Tháng": row.monthKey, "Đội": "", "Đang hoạt động": row.activeCount, "Tổng danh sách": row.totalCount, "Ngày chốt": row.updatedAt })), ...teamMonthlyRows.map(row => ({ "Loại": "Theo Đội", "Tháng": row.monthKey, "Đội": row.unit, "Đang hoạt động": row.activeCount, "Tổng danh sách": row.totalCount, "Ngày chốt": row.updatedAt }))]);
  backupSheet(book, "Tài khoản nội bộ", accountRows.map(row => ({ "Tên đăng nhập": row.username, "Tên hiển thị": row.displayName, "Nhóm": row.groupType, "Vai trò": row.roleCode, "Phạm vi Đội": row.scopeUnits, "Quyền": row.permissionProfile, "Hoạt động": row.isActive === 1 ? "Có" : "Không", "Ngày tạo": row.createdAt, "Cập nhật": row.updatedAt })));
  backupSheet(book, "Nhật ký hoạt động", activityRows.map(row => ({ "Thời điểm": row.createdAt, "Tên đăng nhập": row.username ?? "", "Tên hiển thị": row.displayName ?? "", "Sự kiện": row.eventType, "Loại dữ liệu": row.entityType, "Mã dữ liệu": row.entityId ?? "", "Nội dung": row.summary, "Metadata": row.metadata ?? "" })));

  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx", compression: true });
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `sao-luu-du-lieu-cao-su-cn386-${date}.xlsx`;
  const stored = await storagePut(`backups/${fileName}`, buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const summary = { plots: plots.length, workers: workerRows.length, teamImports: imports.length, teamExports: exports.length, plotProductions: plotProductionRows.length, dailyCare: careRows.length, allocations: allocationRows.length, activityLogs: activityRows.length, accounts: accountRows.length, workforceSnapshots: monthlyRows.length + teamMonthlyRows.length };
  const recordCount = Object.values(summary).reduce((sum, value) => sum + value, 0);
  try {
    const insert = await db.insert(dataBackups).values({ backupKey: input.backupKey, source: input.source, fileName, storageKey: stored.key, sizeBytes: buffer.length, recordCount, summary: JSON.stringify(summary), createdBy: input.createdBy }).$returningId();
    const created = (await db.select().from(dataBackups).where(eq(dataBackups.id, insert[0]!.id)).limit(1))[0]!;
    const all = await db.select().from(dataBackups).orderBy(desc(dataBackups.createdAt));
    const expiredIds = all.slice(8).map(row => row.id);
    if (expiredIds.length) await db.delete(dataBackups).where(inArray(dataBackups.id, expiredIds));
    return { ...created, reused: false };
  } catch (error) {
    const raced = (await db.select().from(dataBackups).where(eq(dataBackups.backupKey, input.backupKey)).limit(1))[0];
    if (raced) return { ...raced, reused: true };
    throw error;
  }
}

export async function listDataBackups() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(dataBackups).orderBy(desc(dataBackups.createdAt));
  return rows.map(row => ({ ...row, summary: JSON.parse(row.summary) as Record<string, number> }));
}

export async function getDataBackupDownload(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const row = (await db.select().from(dataBackups).where(eq(dataBackups.id, id)).limit(1))[0];
  if (!row) throw new Error("Không tìm thấy bản sao lưu");
  return { fileName: row.fileName, url: await storageGetSignedUrl(row.storageKey) };
}

export async function getDataBackupScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(dataBackupSchedule).where(eq(dataBackupSchedule.taskUid, taskUid)).limit(1))[0] ?? null;
}

export async function saveDataBackupSchedule(taskUid: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(dataBackupSchedule).values({ id: 1, taskUid, updatedBy: userId }).onDuplicateKeyUpdate({ set: { taskUid, updatedBy: userId } });
}

export async function getManagementGroupSummary() {
  const db = await getDb();
  if (!db) return MANAGEMENT_GROUPS.map(group => ({ ...group, staffingTarget: null, currentCount: 0, activeCount: 0, shortageCount: null, surplusCount: null }));
  const [accounts, targets] = await Promise.all([db.select().from(internalAccounts), db.select().from(managementGroupTargets)]);
  const targetByGroup = new Map(targets.map(target => [target.groupType, target.staffingTarget]));
  return MANAGEMENT_GROUPS.map(group => {
    const rows = accounts.filter(account => account.groupType === group.groupType);
    const currentCount = rows.length;
    const activeCount = rows.filter(account => account.isActive === 1).length;
    const staffingTarget = targetByGroup.get(group.groupType) ?? null;
    return { ...group, staffingTarget, currentCount, activeCount, shortageCount: staffingTarget == null ? null : Math.max(staffingTarget - activeCount, 0), surplusCount: staffingTarget == null ? null : Math.max(activeCount - staffingTarget, 0) };
  });
}

export async function saveManagementGroupTargets(targets: Array<{ groupType: "board" | "functional" | "production"; staffingTarget: number }>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  for (const target of targets) await db.insert(managementGroupTargets).values({ ...target, updatedBy: userId }).onDuplicateKeyUpdate({ set: { staffingTarget: target.staffingTarget, updatedBy: userId } });
}

export async function createWorker(input: WorkerPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(workers).values({
    ...input,
    employeeCode: input.employeeCode?.trim() || null,
    unit: input.unit?.trim() || null,
    phoneticName: input.phoneticName?.trim() || null,
    phone: input.phone?.trim() || null,
    note: input.note?.trim() || null,
    createdBy: userId,
  });
}

export type WorkerCodeRow = { unit: string; phoneticName: string; employeeCode: string };
const workerCodeKey = (unit: string, phoneticName: string) => `${unit.trim().toLocaleLowerCase("vi")}|${phoneticName.trim().toLocaleLowerCase("vi")}`;

export type PlotIndicatorRow = { code: string; indicatorDate: Date; inventoryPits?: number | null; inventoryTrees?: number | null; tappingTrees?: number | null; immatureTrees?: number | null; nonproductiveTrees?: number | null; diseasedTrees?: number | null; dryTappingTrees?: number | null; emptyPits?: number | null; tappingDensity?: number | null; plotRank?: string | null };
export async function bulkUpdatePlotIndicators(rows: PlotIndicatorRow[]) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const codes = new Set<string>();
  rows.forEach(row => { const code = row.code.trim(); if (codes.has(code)) throw new Error(`Mã lô ${code} bị trùng trong file`); codes.add(code); });
  const plots = await listPlots(); const plotByCode = new Map(plots.map(plot => [plot.code, plot]));
  const resolved = rows.map(row => { const plot = plotByCode.get(row.code.trim()); if (!plot) throw new Error(`Không tìm thấy mã lô ${row.code}`); return { plot, row }; });
  for (const { plot, row } of resolved) await db.update(plantationPlots).set({ indicatorDate: row.indicatorDate, inventoryPits: row.inventoryPits ?? null, inventoryTrees: row.inventoryTrees ?? null, tappingTrees: row.tappingTrees ?? null, immatureTrees: row.immatureTrees ?? null, nonproductiveTrees: row.nonproductiveTrees ?? null, diseasedTrees: row.diseasedTrees ?? null, dryTappingTrees: row.dryTappingTrees ?? null, emptyPits: row.emptyPits ?? null, tappingDensity: row.tappingDensity == null ? null : String(row.tappingDensity), plotRank: row.plotRank?.trim() || null }).where(eq(plantationPlots.id, plot.id));
  return resolved.length;
}

export async function bulkUpdateWorkerCodes(rows: WorkerCodeRow[]) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const fileCodes = new Set<string>(); const fileKeys = new Set<string>();
  for (const row of rows) {
    const code = row.employeeCode.trim(); const key = workerCodeKey(row.unit, row.phoneticName);
    if (fileCodes.has(code)) throw new Error(`Mã số ${code} bị trùng trong file`);
    if (fileKeys.has(key)) throw new Error(`Nhân công ${row.phoneticName} của ${row.unit} bị lặp trong file`);
    fileCodes.add(code); fileKeys.add(key);
  }
  const existing = await listWorkers();
  const workerByKey = new Map(existing.map(worker => [workerCodeKey(worker.unit ?? "", worker.phoneticName ?? worker.name), worker]));
  const codeOwners = new Map(existing.filter(worker => worker.employeeCode).map(worker => [worker.employeeCode!.trim(), worker.id]));
  const resolved = rows.map(row => {
    const worker = workerByKey.get(workerCodeKey(row.unit, row.phoneticName));
    if (!worker) throw new Error(`Không tìm thấy ${row.phoneticName} thuộc ${row.unit}`);
    const ownerId = codeOwners.get(row.employeeCode.trim());
    if (ownerId && ownerId !== worker.id) throw new Error(`Mã số ${row.employeeCode} đã gán cho nhân công khác`);
    return { id: worker.id, employeeCode: row.employeeCode.trim() };
  });
  for (const item of resolved) await db.update(workers).set({ employeeCode: item.employeeCode }).where(eq(workers.id, item.id));
  return resolved.length;
}

export type AssignmentPayload = {
  workerId: number;
  plotId: number;
  task: string;
  assignmentDate: Date;
  status: "planned" | "in_progress" | "completed";
  note?: string | null;
};

export async function createAssignment(input: AssignmentPayload, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  await db.insert(workforceAssignments).values({
    ...input,
    note: input.note?.trim() || null,
    createdBy: userId,
  });
}

export async function listAssignments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: workforceAssignments.id,
    task: workforceAssignments.task,
    assignmentDate: workforceAssignments.assignmentDate,
    status: workforceAssignments.status,
    note: workforceAssignments.note,
    workerId: workers.id,
    workerName: workers.phoneticName,
    plotId: plantationPlots.id,
    plotCode: plantationPlots.code,
    plotName: plantationPlots.name,
    unit: plantationPlots.unit,
  }).from(workforceAssignments)
    .innerJoin(workers, eq(workforceAssignments.workerId, workers.id))
    .innerJoin(plantationPlots, eq(workforceAssignments.plotId, plantationPlots.id))
    .orderBy(desc(workforceAssignments.assignmentDate));
}

export type WorkerPlotAllocationImportRow = {
  unit: string;
  workerName: string;
  employeeCode?: string | null;
  gardenType: "A" | "B" | "C";
  plotCode: string;
  rowStart: number;
  rowEnd: number;
  areaHa: number;
};

export async function bulkUpsertWorkerPlotAllocations(rows: WorkerPlotAllocationImportRow[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  const units = Array.from(new Set(rows.map(row => row.unit)));
  const [workerRows, plotRows] = await Promise.all([
    db.select({ id: workers.id, unit: workers.unit, name: workers.name, employeeCode: workers.employeeCode }).from(workers).where(inArray(workers.unit, units)),
    db.select({ id: plantationPlots.id, unit: plantationPlots.unit, code: plantationPlots.code, gardenType: plantationPlots.gardenType }).from(plantationPlots).where(inArray(plantationPlots.unit, units)),
  ]);
  const workersByUnitAndName = new Map(workerRows.map(worker => [`${worker.unit}::${worker.name.toLowerCase()}`, worker]));
  const workersByUnitAndCode = new Map(workerRows.filter(worker => worker.employeeCode).map(worker => [`${worker.unit}::${worker.employeeCode}`, worker]));
  const plotsByUnitAndCode = new Map(plotRows.map(plot => [`${plot.unit}::${plot.code}`, plot]));
  const desiredGardenType = new Map<number, "A" | "B" | "C">();
  const resolved = rows.map((row, index) => {
    if (row.rowStart > row.rowEnd) throw new Error(`Dòng ${index + 2}: Hàng từ phải nhỏ hơn hoặc bằng Hàng đến`);
    const worker = row.employeeCode?.trim() ? workersByUnitAndCode.get(`${row.unit}::${row.employeeCode.trim()}`) : workersByUnitAndName.get(`${row.unit}::${row.workerName.trim().toLowerCase()}`);
    if (!worker) throw new Error(`Dòng ${index + 2}: Không tìm thấy nhân công ${row.workerName} thuộc ${row.unit}`);
    const plot = plotsByUnitAndCode.get(`${row.unit}::${row.plotCode.trim()}`);
    if (!plot) throw new Error(`Dòng ${index + 2}: Không tìm thấy Mã lô ${row.plotCode} thuộc ${row.unit}`);
    const priorGarden = desiredGardenType.get(plot.id);
    if ((plot.gardenType && plot.gardenType !== row.gardenType) || (priorGarden && priorGarden !== row.gardenType)) throw new Error(`Dòng ${index + 2}: Lô ${row.plotCode} đang thuộc Vườn ${plot.gardenType ?? priorGarden}, không thể phân vào Vườn ${row.gardenType}`);
    desiredGardenType.set(plot.id, row.gardenType);
    return { row, workerId: worker.id, plotId: plot.id };
  });
  for (const [plotId, gardenType] of Array.from(desiredGardenType.entries())) await db.update(plantationPlots).set({ gardenType }).where(eq(plantationPlots.id, plotId));
  for (const item of resolved) await db.insert(workerPlotAllocations).values({ workerId: item.workerId, plotId: item.plotId, gardenType: item.row.gardenType, rowStart: item.row.rowStart, rowEnd: item.row.rowEnd, areaHa: String(item.row.areaHa), createdBy: userId }).onDuplicateKeyUpdate({ set: { gardenType: item.row.gardenType, areaHa: String(item.row.areaHa), createdBy: userId } });
  return resolved.length;
}

export async function listWorkerPlotAllocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    unit: sql<string>`COALESCE(${workers.unit}, '')`,
    workerName: workers.name,
    employeeCode: workers.employeeCode,
    gardenType: workerPlotAllocations.gardenType,
    plotCode: plantationPlots.code,
    plotName: plantationPlots.name,
    rowStart: workerPlotAllocations.rowStart,
    rowEnd: workerPlotAllocations.rowEnd,
    areaHa: workerPlotAllocations.areaHa,
  }).from(workerPlotAllocations).innerJoin(workers, eq(workerPlotAllocations.workerId, workers.id)).innerJoin(plantationPlots, eq(workerPlotAllocations.plotId, plantationPlots.id)).orderBy(asc(workers.unit), asc(workers.name), asc(plantationPlots.code));
}

export async function getWorkerPlotAreaDistribution(scopeUnits?: string[], gardenType?: "A" | "B" | "C") {
  const db = await getDb();
  if (!db) return { teams: [], workers: [] };
  const hasScope = Boolean(scopeUnits?.length);
  const [plotRows, allocationRows] = await Promise.all([
    db.select({ id: plantationPlots.id, unit: plantationPlots.unit, areaHa: plantationPlots.areaHa, gardenType: plantationPlots.gardenType }).from(plantationPlots),
    db.select({ workerId: workers.id, unit: workers.unit, workerName: workers.name, phoneticName: workers.phoneticName, employeeCode: workers.employeeCode, areaHa: workerPlotAllocations.areaHa, gardenType: plantationPlots.gardenType }).from(workerPlotAllocations).innerJoin(workers, eq(workerPlotAllocations.workerId, workers.id)).innerJoin(plantationPlots, eq(workerPlotAllocations.plotId, plantationPlots.id)),
  ]);
  const inScope = (unit: string | null) => !hasScope || Boolean(unit && scopeUnits?.includes(unit));
  const scopedPlots = plotRows.filter(plot => inScope(plot.unit) && (!gardenType || plot.gardenType === gardenType));
  const scopedAllocations = allocationRows.filter(allocation => inScope(allocation.unit) && (!gardenType || allocation.gardenType === gardenType));
  const areaByUnit = new Map<string, { totalAreaHa: number; plotCount: number }>();
  scopedPlots.forEach(plot => {
    const item = areaByUnit.get(plot.unit) ?? { totalAreaHa: 0, plotCount: 0 };
    item.totalAreaHa += Number(plot.areaHa); item.plotCount += 1; areaByUnit.set(plot.unit, item);
  });
  const allocatedByUnit = new Map<string, { allocatedAreaHa: number; allocationCount: number }>();
  const workerById = new Map<number, { workerId: number; unit: string; workerName: string; phoneticName: string | null; employeeCode: string | null; allocatedAreaHa: number; allocationCount: number }>();
  scopedAllocations.forEach(allocation => {
    if (!allocation.unit) return;
    const unitItem = allocatedByUnit.get(allocation.unit) ?? { allocatedAreaHa: 0, allocationCount: 0 };
    unitItem.allocatedAreaHa += Number(allocation.areaHa); unitItem.allocationCount += 1; allocatedByUnit.set(allocation.unit, unitItem);
    const workerItem = workerById.get(allocation.workerId) ?? { workerId: allocation.workerId, unit: allocation.unit, workerName: allocation.workerName, phoneticName: allocation.phoneticName, employeeCode: allocation.employeeCode, allocatedAreaHa: 0, allocationCount: 0 };
    workerItem.allocatedAreaHa += Number(allocation.areaHa); workerItem.allocationCount += 1; workerById.set(allocation.workerId, workerItem);
  });
  return {
    teams: TEAM_ORDER.filter(unit => areaByUnit.has(unit)).map(unit => ({ unit, ...areaByUnit.get(unit)!, ...(allocatedByUnit.get(unit) ?? { allocatedAreaHa: 0, allocationCount: 0 }) })),
    workers: Array.from(workerById.values()).sort((a, b) => a.unit.localeCompare(b.unit, "vi") || a.workerName.localeCompare(b.workerName, "vi")),
  };
}

export async function listPeriods() {
  const db = await getDb();
  if (!db) return [];
  const [imports, exports] = await Promise.all([
    db.selectDistinct({ label: latexImports.periodLabel }).from(latexImports),
    db.selectDistinct({ label: latexExports.periodLabel }).from(latexExports),
  ]);
  const existing = Array.from(new Set([...imports, ...exports].map(item => item.label)));
  const standard = ["Đợt 1", "Đợt 2", "Đợt 3"];
  return [...standard, ...existing.filter(label => !standard.includes(label))];
}

export async function getDashboard(periodLabel?: string, scopeUnits?: string[]) {
  const selectedPeriod = periodLabel || "Đợt 1";
  const db = await getDb();
  const hasScope = Boolean(scopeUnits?.length);
  if (!db) return { plotCount: 0, totalArea: 0, totalHarvested: 0, totalProduction: 0, workforceCount: 0, workforceSummary: { staffingTarget: 0, currentCount: 0, shortageCount: 0, surplusCount: 0 }, workforceTeams: [], workforceTrend: [], periodLabel: selectedPeriod, totalImport: 0, totalExport: 0, lossRate: 0, managementGroups: [], periodProduction: [], monthlyProduction: [], teamOverview: [], teamMonthlyProduction: [], teamQuarterlyProduction: [] };
  const [plots, plotImports, plotExports, teamImports, teamExports, workerRows, managementGroups, workforceTeams, workforceTrend] = await Promise.all([listPlots(), listLatexImports(), listLatexExports(), listTeamImports(), listTeamExports(), listWorkers(), hasScope ? Promise.resolve([]) : getManagementGroupSummary(), getWorkforceTeamSummary(), hasScope ? Promise.resolve([]) : getWorkforceMonthlySnapshots()]);
  const inScope = (unit: string | null) => !hasScope || Boolean(unit && scopeUnits?.includes(unit));
  const scopedPlots = plots.filter(plot => inScope(plot.unit));
  const imports = teamImports.length ? teamImports : plotImports;
  const exports = teamExports.length ? teamExports : plotExports;
  const scopedImports = imports.filter(row => inScope(row.unit));
  const scopedExports = exports.filter(row => inScope(row.unit));
  const scopedWorkers = workerRows.filter(worker => inScope(worker.unit));
  const scopedWorkforceTeams = workforceTeams.filter(team => !hasScope || scopeUnits?.includes(team.unit));
  const workforceSummary = scopedWorkforceTeams.reduce((sum, team) => ({ staffingTarget: sum.staffingTarget + (team.staffingTarget ?? 0), currentCount: sum.currentCount + team.staffingCount, shortageCount: sum.shortageCount + (team.shortageCount ?? 0), surplusCount: sum.surplusCount + (team.surplusCount ?? 0) }), { staffingTarget: 0, currentCount: 0, shortageCount: 0, surplusCount: 0 });
  const selectedImports = scopedImports.filter(row => row.periodLabel === selectedPeriod);
  const selectedExports = scopedExports.filter(row => row.periodLabel === selectedPeriod);
  const totalImport = selectedImports.reduce((sum, row) => sum + row.totalImport, 0);
  const totalExport = selectedExports.reduce((sum, row) => sum + row.totalExport, 0);
  const totalProduction = scopedImports.reduce((sum, row) => sum + row.totalImport, 0);
  const monthKey = (date: Date) => date.toISOString().slice(0, 7);
  const aggregate = <T>(rows: T[], keyFor: (row: T) => string, valueFor: (row: T) => number) => Array.from(rows.reduce((map, row) => map.set(keyFor(row), (map.get(keyFor(row)) ?? 0) + valueFor(row)), new Map<string, number>()).entries()).map(([label, value]) => ({ label, value }));
  const periodProduction = aggregate(scopedImports, row => row.periodLabel, row => row.totalImport).sort((left, right) => comparePeriodLabel(left.label, right.label));
  const monthlyProduction = aggregate(selectedImports, row => monthKey(row.recordDate), row => row.totalImport).sort((left, right) => left.label.localeCompare(right.label));
  const unitList = TEAM_ORDER.filter(unit => !hasScope || scopeUnits?.includes(unit));
  const teamOverview = unitList.map(unit => {
    const teamPlots = scopedPlots.filter(plot => plot.unit === unit);
    const teamWorkers = scopedWorkers.filter(worker => worker.unit === unit);
    const teamImports = scopedImports.filter(row => row.unit === unit);
    return { unit, areaHa: teamPlots.reduce((sum, plot) => sum + plot.areaHa, 0), plotCount: teamPlots.length, workforceCount: teamWorkers.filter(worker => worker.status === "active").length, totalProduction: teamImports.reduce((sum, row) => sum + row.totalImport, 0) };
  });
  const teamMonthlyMap = new Map<string, Record<string, string | number>>();
  selectedImports.forEach(row => { const month = monthKey(row.recordDate); const entry = teamMonthlyMap.get(month) ?? { month }; entry[row.unit] = Number(entry[row.unit] ?? 0) + row.totalImport; teamMonthlyMap.set(month, entry); });
  const teamQuarterlyMap = new Map<string, Record<string, string | number>>();
  scopedImports.forEach(row => { const month = row.recordDate.getUTCMonth() + 1; const quarter = Math.ceil(month / 3); const year = row.recordDate.getUTCFullYear(); const quarterKey = `${year}-Q${quarter}`; const entry = teamQuarterlyMap.get(quarterKey) ?? { quarter: `Quý ${quarter}/${year}`, order: year * 10 + quarter }; entry[row.unit] = Number(entry[row.unit] ?? 0) + row.totalImport; teamQuarterlyMap.set(quarterKey, entry); });
  const teamQuarterlyProduction = Array.from(teamQuarterlyMap.values()).sort((left, right) => Number(left.order) - Number(right.order));
  const latestQuarter = teamQuarterlyProduction.at(-1);
  const latestQuarterOrder = Number(latestQuarter?.order ?? 0);
  const latestYear = Math.floor(latestQuarterOrder / 10);
  const latestQuarterNumber = latestQuarterOrder % 10;
  const previousYearQuarter = latestYear > 0 ? teamQuarterlyMap.get(`${latestYear - 1}-Q${latestQuarterNumber}`) : undefined;
  const quarterlyYearComparison = latestQuarter ? {
    currentLabel: String(latestQuarter.quarter),
    previousLabel: `Quý ${latestQuarterNumber}/${latestYear - 1}`,
    hasPreviousData: Boolean(previousYearQuarter),
    teams: unitList.map(unit => {
      const currentTotalImport = Number(latestQuarter[unit] ?? 0);
      const previousTotalImport = previousYearQuarter ? Number(previousYearQuarter[unit] ?? 0) : null;
      const importChange = previousTotalImport == null ? null : currentTotalImport - previousTotalImport;
      const changePercent = previousTotalImport && importChange != null ? (importChange / previousTotalImport) * 100 : null;
      return { unit, currentTotalImport, previousTotalImport, importChange, changePercent };
    }),
  } : null;
  return { plotCount: scopedPlots.length, totalArea: scopedPlots.reduce((sum, plot) => sum + plot.areaHa, 0), totalHarvested: totalImport, totalProduction, workforceCount: scopedWorkers.filter(worker => worker.status === "active").length, workforceSummary, workforceTeams: scopedWorkforceTeams.map(team => ({ unit: team.unit, staffingTarget: team.staffingTarget ?? 0, currentCount: team.staffingCount, shortageCount: team.shortageCount ?? 0, surplusCount: team.surplusCount ?? 0 })), workforceTrend, periodLabel: selectedPeriod, ...calculateLatexTotals(totalImport, totalExport), managementGroups, periodProduction, monthlyProduction, teamOverview, teamMonthlyProduction: Array.from(teamMonthlyMap.values()).sort((left, right) => String(left.month).localeCompare(String(right.month))), teamQuarterlyProduction, quarterlyYearComparison };
}

export async function getLatexProductionManagement(input: { year?: number; month?: number; unit?: string }, scopeUnits?: string[]) {
  const [plotImports, plotExports, teamImports, teamExports] = await Promise.all([listLatexImports(), listLatexExports(), listTeamImports(), listTeamExports()]);
  const imports = teamImports.length ? teamImports : plotImports;
  const exports = teamExports.length ? teamExports : plotExports;
  const hasScope = Boolean(scopeUnits?.length);
  const inScope = (unit: string | null) => !hasScope || Boolean(unit && scopeUnits?.includes(unit));
  const scopedImports = imports.filter(row => inScope(row.unit));
  const scopedExports = exports.filter(row => inScope(row.unit));
  const getYear = (date: Date) => date.getUTCFullYear();
  const getMonth = (date: Date) => date.getUTCMonth() + 1;
  const availableYears = Array.from(new Set(scopedImports.map(row => getYear(row.recordDate)))).sort((a, b) => b - a);
  const selectedYear = input.year && availableYears.includes(input.year) ? input.year : availableYears[0] ?? new Date().getUTCFullYear();
  const availableMonths = Array.from(new Set(scopedImports.filter(row => getYear(row.recordDate) === selectedYear).map(row => getMonth(row.recordDate)))).sort((a, b) => a - b);
  const selectedMonth = input.month && availableMonths.includes(input.month) ? input.month : availableMonths[availableMonths.length - 1] ?? new Date().getUTCMonth() + 1;
  const selectedUnit = input.unit && TEAM_ORDER.includes(input.unit as typeof TEAM_ORDER[number]) ? input.unit : undefined;
  const importsForView = scopedImports.filter(row => getYear(row.recordDate) === selectedYear && getMonth(row.recordDate) === selectedMonth && (!selectedUnit || row.unit === selectedUnit));
  const exportsForView = scopedExports.filter(row => getYear(row.recordDate) === selectedYear && getMonth(row.recordDate) === selectedMonth && (!selectedUnit || row.unit === selectedUnit));
  const previousDate = new Date(Date.UTC(selectedYear, selectedMonth - 2, 1));
  const previousYear = previousDate.getUTCFullYear();
  const previousMonth = previousDate.getUTCMonth() + 1;
  const previousImports = scopedImports.filter(row => getYear(row.recordDate) === previousYear && getMonth(row.recordDate) === previousMonth && (!selectedUnit || row.unit === selectedUnit));
  const frozenLatex = importsForView.reduce((sum, row) => sum + row.frozenLatex, 0);
  const latexThread = importsForView.reduce((sum, row) => sum + row.latexThread, 0);
  const totalImport = importsForView.reduce((sum, row) => sum + row.totalImport, 0);
  const previousTotalImport = previousImports.reduce((sum, row) => sum + row.totalImport, 0);
  const availableUnits = TEAM_ORDER.filter(unit => !hasScope || scopeUnits?.includes(unit));
  const teamComparisons = availableUnits.map(unit => {
    const currentTotalImport = scopedImports.filter(row => getYear(row.recordDate) === selectedYear && getMonth(row.recordDate) === selectedMonth && row.unit === unit).reduce((sum, row) => sum + row.totalImport, 0);
    const previousTotal = scopedImports.filter(row => getYear(row.recordDate) === previousYear && getMonth(row.recordDate) === previousMonth && row.unit === unit).reduce((sum, row) => sum + row.totalImport, 0);
    return { unit, currentTotalImport, previousTotalImport: previousTotal, importChange: currentTotalImport - previousTotal, changePercent: previousTotal > 0 ? ((currentTotalImport - previousTotal) / previousTotal) * 100 : null };
  });
  return { year: selectedYear, month: selectedMonth, unit: selectedUnit ?? "all", availableYears, availableMonths, availableUnits, frozenLatex, latexThread, totalImport, previousMonth, previousYear, previousTotalImport, importChange: totalImport - previousTotalImport, importRecordCount: importsForView.length, exportRecordCount: exportsForView.length, teamComparisons };
}

export async function getProgressReport(periodLabel: string) {
  const db = await getDb();
  if (!db) return [];
  const [plots, imports, exports] = await Promise.all([
    listPlots(),
    listLatexImports(periodLabel),
    listLatexExports(periodLabel),
  ]);
  const byPlot = new Map<number, {
    frozenLatex: number;
    latexThreadImport: number;
    frozenContaminatedLatex: number;
    latexThreadExport: number;
    dailyImports: { recordDate: Date; frozenLatex: number; latexThread: number; totalImport: number }[];
  }>();
  plots.forEach(plot => byPlot.set(plot.id, { frozenLatex: 0, latexThreadImport: 0, frozenContaminatedLatex: 0, latexThreadExport: 0, dailyImports: [] }));
  imports.forEach(item => {
    const summary = byPlot.get(item.plotId);
    if (!summary) return;
    summary.frozenLatex += item.frozenLatex;
    summary.latexThreadImport += item.latexThread;
    summary.dailyImports.push({ recordDate: item.recordDate, frozenLatex: item.frozenLatex, latexThread: item.latexThread, totalImport: item.totalImport });
  });
  exports.forEach(item => {
    const summary = byPlot.get(item.plotId);
    if (!summary) return;
    summary.frozenContaminatedLatex += item.frozenContaminatedLatex;
    summary.latexThreadExport += item.latexThread;
  });
  return plots.map(plot => {
    const summary = byPlot.get(plot.id)!;
    const totalImport = summary.frozenLatex + summary.latexThreadImport;
    const totalExport = summary.frozenContaminatedLatex + summary.latexThreadExport;
    return {
      ...plot,
      ...summary,
      ...calculateLatexTotals(totalImport, totalExport),
    };
  });
}
