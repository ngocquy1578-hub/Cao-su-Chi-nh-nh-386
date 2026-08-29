import * as XLSX from "xlsx";
import { getDataBackupDownload, listDataBackups } from "../server/db.ts";

const backups = await listDataBackups();
const backup = backups[0];
if (!backup) throw new Error("Không có bản sao lưu để xác minh");

const { url, fileName } = await getDataBackupDownload(backup.id);
const response = await fetch(url);
if (!response.ok) throw new Error(`Không tải được tệp sao lưu: HTTP ${response.status}`);

const workbook = XLSX.read(Buffer.from(await response.arrayBuffer()), { type: "buffer" });
const expectedSheets = ["Lô vườn", "Nhân công", "Nhập mủ đội", "Xuất mủ đội", "Theo dõi hằng ngày", "Phân công nhân công", "Snapshot nhân công", "Tài khoản nội bộ", "Nhật ký hoạt động"];
for (const sheet of expectedSheets) {
  if (!workbook.SheetNames.includes(sheet)) throw new Error(`Thiếu sheet ${sheet}`);
}

const serialized = workbook.SheetNames.map(sheet => XLSX.utils.sheet_to_csv(workbook.Sheets[sheet])).join("\n");
if (/passwordHash|mật khẩu/i.test(serialized)) throw new Error("Phát hiện trường mật khẩu trong bản sao lưu");

console.log(JSON.stringify({ id: backup.id, fileName, sheetCount: workbook.SheetNames.length, recordCount: backup.recordCount, passwordFieldExcluded: true }, null, 2));
process.exit(0);
