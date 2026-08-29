import mysql from "mysql2/promise";
import XLSX from "xlsx";

const source = "/home/ubuntu/upload/1.import-Vuoncay,lo.xlsx";
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const numeric = value => Number(String(value ?? "0").replace(",", ".").trim()) || 0;
const codePart = value => clean(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/Đ/g, "D")
  .replace(/đ/g, "d")
  .replace(/[^A-Za-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "")
  .toUpperCase();

const workbook = XLSX.readFile(source, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Sheet1, { header: 1, defval: "", range: 2 });
const updates = rows
  .filter(row => clean(row[0]))
  .map(row => ({
    code: `LO-${codePart(row[1])}-${codePart(row[3])}-${codePart(row[2])}`.slice(0, 48),
    areaHa: numeric(row[5]),
  }))
  .filter(row => row.areaHa > 0);

if (updates.length !== 208 || new Set(updates.map(row => row.code)).size !== updates.length) {
  throw new Error("File Excel không tạo được đúng 208 mã lô duy nhất; dừng cập nhật.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [databasePlots] = await connection.execute("SELECT code FROM plantation_plots");
  const databaseCodes = new Set(databasePlots.map(row => row.code));
  const missingCodes = updates.filter(row => !databaseCodes.has(row.code)).map(row => row.code);
  if (missingCodes.length) {
    throw new Error(`Không tìm thấy ${missingCodes.length} mã lô trong hệ thống: ${missingCodes.slice(0, 5).join(", ")}`);
  }

  await connection.beginTransaction();
  for (const update of updates) {
    const [result] = await connection.execute(
      "UPDATE plantation_plots SET areaHa = ? WHERE code = ?",
      [update.areaHa.toFixed(3), update.code],
    );
    if (result.affectedRows !== 1) throw new Error(`Không cập nhật được diện tích mã lô ${update.code}`);
  }
  await connection.commit();

  const [summary] = await connection.execute(
    "SELECT unit, CAST(SUM(areaHa) AS DECIMAL(14,3)) AS totalAreaHa FROM plantation_plots GROUP BY unit ORDER BY CAST(REPLACE(unit, 'Đội ', '') AS UNSIGNED)",
  );
  const totalAreaHa = summary.reduce((sum, row) => sum + Number(row.totalAreaHa), 0);
  console.log(JSON.stringify({ updatedPlots: updates.length, summary, totalAreaHa: totalAreaHa.toFixed(3) }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
