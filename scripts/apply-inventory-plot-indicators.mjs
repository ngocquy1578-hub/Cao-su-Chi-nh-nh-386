import fs from "node:fs";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const filePath = "/home/ubuntu/Downloads/import_chi_so_cay_kiem_ke_2026-08-22.xlsx";
const workbook = XLSX.readFile(filePath);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Chỉ số cây định kỳ"], { defval: null });
const integer = value => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.trunc(parsed) : null; };
const decimal = value => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; };
const records = rows.map((row, index) => ({
  row: index + 2, code: String(row["Mã lô"] ?? "").trim(), date: String(row["Ngày cập nhật"] ?? ""), inventoryPits: integer(row["Tổng số hố kiểm kê"]), inventoryTrees: integer(row["Tổng số cây kiểm kê"]), tappingTrees: integer(row["Cây cạo"]), immatureTrees: integer(row["Cây chưa đủ tiêu chuẩn"]), nonproductiveTrees: integer(row["Cây không hiệu quả"]), diseasedTrees: integer(row["Cây bệnh không cạo"]), dryTappingTrees: integer(row["Cây khô miệng cạo"]), emptyPits: integer(row["Hố trống"]), tappingDensity: decimal(row["Mật độ cây cạo/ha"]), plotRank: String(row["Xếp hạng vườn cây"] ?? "").trim(),
}));
const validationErrors = records.filter(record => !record.code || record.date !== "2026-08-22" || [record.inventoryPits, record.inventoryTrees, record.tappingTrees, record.immatureTrees, record.nonproductiveTrees, record.diseasedTrees, record.dryTappingTrees, record.emptyPits, record.tappingDensity].some(value => value === null) || !record.plotRank).map(record => `Dòng ${record.row} thiếu dữ liệu hoặc ngày không đúng`);
if (records.length !== 208 || new Set(records.map(record => record.code)).size !== 208 || validationErrors.length) throw new Error(JSON.stringify({ rows: records.length, uniqueCodes: new Set(records.map(record => record.code)).size, validationErrors }));
const db = await mysql.createConnection(process.env.DATABASE_URL);
const [systemRows] = await db.query("SELECT code FROM plantation_plots");
const systemCodes = new Set(systemRows.map(row => row.code));
const missing = records.map(record => record.code).filter(code => !systemCodes.has(code));
if (missing.length) throw new Error(`Không tìm thấy ${missing.length} mã lô trong hệ thống: ${missing.slice(0, 10).join(", ")}`);
const expected = records.reduce((total, record) => ({
  inventoryPits: total.inventoryPits + record.inventoryPits, inventoryTrees: total.inventoryTrees + record.inventoryTrees, tappingTrees: total.tappingTrees + record.tappingTrees, immatureTrees: total.immatureTrees + record.immatureTrees, nonproductiveTrees: total.nonproductiveTrees + record.nonproductiveTrees, diseasedTrees: total.diseasedTrees + record.diseasedTrees, dryTappingTrees: total.dryTappingTrees + record.dryTappingTrees, emptyPits: total.emptyPits + record.emptyPits,
}), { inventoryPits: 0, inventoryTrees: 0, tappingTrees: 0, immatureTrees: 0, nonproductiveTrees: 0, diseasedTrees: 0, dryTappingTrees: 0, emptyPits: 0 });
await db.beginTransaction();
try {
  const statement = "UPDATE plantation_plots SET inventoryPits = ?, inventoryTrees = ?, tappingTrees = ?, immatureTrees = ?, nonproductiveTrees = ?, diseasedTrees = ?, dryTappingTrees = ?, emptyPits = ?, tappingDensity = ?, plotRank = ?, indicatorDate = ? WHERE code = ?";
  for (const record of records) await db.execute(statement, [record.inventoryPits, record.inventoryTrees, record.tappingTrees, record.immatureTrees, record.nonproductiveTrees, record.diseasedTrees, record.dryTappingTrees, record.emptyPits, record.tappingDensity, record.plotRank, "2026-08-22 00:00:00", record.code]);
  const [summaryRows] = await db.query("SELECT COUNT(*) AS indicatorRows, SUM(inventoryPits) AS inventoryPits, SUM(inventoryTrees) AS inventoryTrees, SUM(tappingTrees) AS tappingTrees, SUM(immatureTrees) AS immatureTrees, SUM(nonproductiveTrees) AS nonproductiveTrees, SUM(diseasedTrees) AS diseasedTrees, SUM(dryTappingTrees) AS dryTappingTrees, SUM(emptyPits) AS emptyPits FROM plantation_plots WHERE indicatorDate = '2026-08-22 00:00:00'");
  const actual = Object.fromEntries(Object.entries(summaryRows[0]).map(([key, value]) => [key, Number(value)]));
  if (actual.indicatorRows !== 208 || Object.entries(expected).some(([key, value]) => actual[key] !== value)) throw new Error(JSON.stringify({ expected, actual }));
  await db.commit();
  fs.writeFileSync("/home/ubuntu/inventory_import_result.json", JSON.stringify({ imported: records.length, date: "2026-08-22", expected, actual }, null, 2));
  console.log(JSON.stringify({ imported: records.length, date: "2026-08-22", expected }));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  db.destroy();
}
