import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { filterByScope, requirePermission } from "../access";
import { protectedProcedure, router } from "../_core/trpc";

const categories = z.enum(["tapping", "reinforcement", "care", "treatment"]);
const record = z.object({ category: categories, activityDate: z.coerce.date(), unit: z.string().trim().min(1).max(120), gardenName: z.string().trim().min(1).max(160), plotId: z.coerce.number().int().positive().optional().nullable(), areaHa: z.coerce.number().min(0).optional().nullable(), tappingSection: z.coerce.number().int().min(0).optional().nullable(), planQuantity: z.coerce.number().min(0), actualQuantity: z.coerce.number().min(0), cumulativeQuantity: z.coerce.number().min(0).optional(), metricUnit: z.string().trim().min(1).max(24), completedGardens: z.coerce.number().int().min(0).optional().nullable(), pendingGardens: z.coerce.number().int().min(0).optional().nullable(), partialGardens: z.coerce.number().int().min(0).optional().nullable(), nextGarden: z.string().max(160).optional().nullable(), workContent: z.string().max(220).optional().nullable(), note: z.string().max(2000).optional().nullable() });

export const operationsRouter = router({
  list: protectedProcedure.input(z.object({ category: categories.optional() }).optional()).query(async ({ input, ctx }) => filterByScope(await db.listDailyCareRecords(input?.category), await requirePermission(ctx, "care:read"))),
  save: protectedProcedure.input(record).mutation(async ({ input, ctx }) => { if (ctx.user.role !== "admin") { const account = await db.getInternalAccountByUserId(ctx.user.id); const permissions = account ? JSON.parse(account.permissionProfile) as string[] : []; const scope = account ? JSON.parse(account.scopeUnits) as string[] : []; if (!account || !permissions.includes("care:write") || (scope.length && !scope.includes(input.unit))) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền nhập dữ liệu cho đơn vị này" }); } await db.saveDailyCareRecord(input, ctx.user.id); await db.logActivity(ctx.user.id, { eventType: "operations.save", entityType: "daily_care_record", summary: `Ghi dữ liệu ${input.category} cho ${input.unit}`, metadata: { category: input.category, unit: input.unit, gardenName: input.gardenName, actualQuantity: input.actualQuantity } }); return { success: true }; }),
  productionChange: protectedProcedure.query(async ({ ctx }) => { const profile = await requirePermission(ctx, "reports:read"); const report = await db.getProductionChangeReport(); return profile.fullAccess || !profile.scopeUnits.length ? report : { ...report, rows: filterByScope(report.rows, profile) }; }),
});
