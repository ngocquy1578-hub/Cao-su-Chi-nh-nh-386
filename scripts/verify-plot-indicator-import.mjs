import XLSX from "xlsx";

const workbook = XLSX.readFile("/home/ubuntu/Downloads/import_chi_so_cay_kiem_ke_2026-08-22.xlsx");
const sheet = workbook.Sheets["Chỉ số cây định kỳ"];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
const dates = new Set(rows.map(row => row["Ngày cập nhật"]));
const codes = rows.map(row => String(row["Mã lô"] ?? "").trim());
const blankCodes = codes.filter(code => !code).length;
const uniqueCodes = new Set(codes).size;
if (rows.length !== 208 || dates.size !== 1 || !dates.has("2026-08-22") || blankCodes || uniqueCodes !== rows.length) {
  throw new Error(JSON.stringify({ rows: rows.length, dates: Array.from(dates), blankCodes, uniqueCodes }));
}
console.log(JSON.stringify({ rows: rows.length, date: "2026-08-22", blankCodes, uniqueCodes, first: rows[0], last: rows.at(-1) }));
