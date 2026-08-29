import { getDb, createDataBackup } from "../server/db.ts";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");

const admin = (await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1))[0];
if (!admin) throw new Error("Không tìm thấy tài khoản quản trị để tạo bản sao lưu");

const backup = await createDataBackup({
  backupKey: "verification-initial-backup-2026-08-23",
  source: "manual",
  createdBy: admin.id,
});

console.log(JSON.stringify({ id: backup.id, fileName: backup.fileName, recordCount: backup.recordCount, sizeBytes: backup.sizeBytes, reused: backup.reused }, null, 2));
process.exit(0);
