import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { operationsRouter } from "./routers/operations";
import { internalAccountsRouter } from "./routers/internalAccounts";
import { activityRouter } from "./routers/activity";
import { publicProcedure, router } from "./_core/trpc";
import { dataToolsRouter } from "./routers/dataTools";
import { rubberRouter } from "./routers/rubber";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  operations: operationsRouter,
  internalAccounts: internalAccountsRouter,
  activity: activityRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("cn386_internal_session", { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  rubber: rubberRouter,
  dataTools: dataToolsRouter,
});

export type AppRouter = typeof appRouter;
