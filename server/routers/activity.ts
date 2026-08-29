import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const activityRouter = router({
  list: adminProcedure.input(z.object({ userId: z.number().int().positive().optional(), username: z.string().trim().min(1).max(80).optional(), eventType: z.string().trim().min(1).max(64).optional(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), limit: z.number().int().min(20).max(500).optional() }).optional()).query(({ input }) => db.listActivityLogs(input)),
  accounts: adminProcedure.query(() => db.listActivityActors()),
});
