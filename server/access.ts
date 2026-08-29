import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

export type AccessProfile = { permissions: string[]; scopeUnits: string[]; fullAccess: boolean };
export async function accessProfile(ctx: TrpcContext): Promise<AccessProfile> { if (ctx.user?.role === "admin") return { permissions: ["*"], scopeUnits: [], fullAccess: true }; if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const account = await db.getInternalAccountByUserId(ctx.user.id); if (!account || account.isActive !== 1) throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản nội bộ chưa được cấp quyền hoặc đã bị khóa" }); return { permissions: JSON.parse(account.permissionProfile) as string[], scopeUnits: JSON.parse(account.scopeUnits) as string[], fullAccess: false }; }
export async function requirePermission(ctx: TrpcContext, permission: string, unit?: string) { const profile = await accessProfile(ctx); if (!profile.fullAccess && !profile.permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền thao tác này" }); if (unit && profile.scopeUnits.length && !profile.scopeUnits.includes(unit)) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền với đơn vị này" }); return profile; }
export function filterByScope<T extends { unit: string }>(rows: T[], profile: AccessProfile) { return profile.fullAccess || !profile.scopeUnits.length ? rows : rows.filter(row => profile.scopeUnits.includes(row.unit)); }
