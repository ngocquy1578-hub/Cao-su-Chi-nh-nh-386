import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ listActivityLogs: vi.fn() }));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

function context(role: "admin" | "user"): TrpcContext {
  return { user: { id: role === "admin" ? 1 : 2, openId: role, name: role, email: null, loginMethod: "internal", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("activityRouter", () => {
  it("chỉ cho phép admin xem nhật ký hoạt động", async () => {
    dbMocks.listActivityLogs.mockResolvedValue([{ id: 1, eventType: "auth.login" }]);
    await expect(appRouter.createCaller(context("admin")).activity.list()).resolves.toEqual([{ id: 1, eventType: "auth.login" }]);
    await expect(appRouter.createCaller(context("user")).activity.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
