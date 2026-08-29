import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { getVietnamMonthKey, isFirstDayOfVietnamMonth } from "../workforceSnapshotTime";
import { getVietnamBackupDateKey, isVietnamSunday } from "../dataBackupTime";

function registerWorkforceSnapshotSchedule(app: express.Express) {
  app.post("/api/scheduled/workforce-monthly-snapshot", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const schedule = await db.getWorkforceSnapshotScheduleByTaskUid(user.taskUid);
      if (!schedule) return res.json({ ok: true, skipped: "orphan" });
      if (!isFirstDayOfVietnamMonth()) return res.json({ ok: true, skipped: "not-first-day-vietnam" });
      const captured = await db.captureWorkforceMonthlySnapshots(getVietnamMonthKey(), schedule.updatedBy);
      await db.logActivity(schedule.updatedBy, { eventType: "workforce.monthly_snapshot.automatic", entityType: "workforce_monthly_snapshot", entityId: captured.overall.month, summary: `Tự động chốt số liệu nhân công ${captured.overall.month}`, metadata: captured.overall });
      return res.json({ ok: true, snapshot: captured.overall });
    } catch (error) {
      console.error("[Scheduled workforce snapshot]", error);
      return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
    }
  });
}

function registerDataBackupSchedule(app: express.Express) {
  app.post("/api/scheduled/weekly-data-backup", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const schedule = await db.getDataBackupScheduleByTaskUid(user.taskUid);
      if (!schedule) return res.json({ ok: true, skipped: "orphan" });
      if (!isVietnamSunday()) return res.json({ ok: true, skipped: "not-sunday-vietnam" });
      const backup = await db.createDataBackup({ backupKey: `automatic-${getVietnamBackupDateKey()}`, source: "automatic", createdBy: schedule.updatedBy });
      await db.logActivity(schedule.updatedBy, { eventType: "data.backup.automatic", entityType: "data_backup", entityId: backup.id, summary: `Tự động tạo bản sao lưu ${backup.fileName}`, metadata: { recordCount: backup.recordCount, reused: backup.reused } });
      return res.json({ ok: true, backup: { id: backup.id, fileName: backup.fileName, recordCount: backup.recordCount, reused: backup.reused } });
    } catch (error) {
      console.error("[Scheduled data backup]", error);
      return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
    }
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerWorkforceSnapshotSchedule(app);
  registerDataBackupSchedule(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
