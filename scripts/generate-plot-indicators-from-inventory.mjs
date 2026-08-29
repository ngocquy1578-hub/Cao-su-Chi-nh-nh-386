import fs from "node:fs";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const sourcePath = "/home/ubuntu/upload/THCHUNGKIỂMKÊCSKD-CPC.xlsx";
const outputPath = "/home/ubuntu/Downloads/import_chi_so_cay_kiem_ke_2026-08-22.xlsx";
const updateDate = "2026-08-22";
const workbook = XLSX.readFile(sourcePath, { cellFormula: false, cellNF: false, cellText: false });
const sheet = workbook.Sheets["Chi tiết KK CSKD tại Campuchia"];
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const numeric = value => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; };
const integer = value => { const parsed = numeric(value); return parsed === null ? null : Math.trunc(parsed); };
const normalizePlotName = value => clean(value).replace(/^lô\s*/i, "").replace(/\s*\(\d{4}\)\s*$/i, "").replaceAll(" ", "").toUpperCase();
const sourceRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(5).map((values, offset) => ({
  sourceRow: offset + 6, unit: clean(values[1]), plotName: clean(values[2]), plantedYear: integer(values[3]), cultivar: clean(values[4]), areaHa: numeric(values[5]), totalPits: integer(values[6]), totalTrees: integer(values[7]), tappingTrees: integer(values[8]), immatureTrees: integer(values[10]), nonproductiveTrees: integer(values[12]), diseasedTrees: integer(values[14]), dryTappingTrees: integer(values[16]), emptyPits: integer(values[18]), tappingDensity: numeric(values[19]), plotRank: clean(values[20]),
})).filter(row => row.unit.startsWith("Đội") && row.plotName && row.plantedYear);
const db = await mysql.createConnection(process.env.DATABASE_URL);
const [systemPlots] = await db.query("SELECT unit, code, name, plantedYear FROM plantation_plots");
db.destroy();
const plotsByKey = new Map(systemPlots.map(plot => [`${plot.unit}::${integer(plot.plantedYear)}::${normalizePlotName(plot.name)}`, plot]));
const importRows = [], mappingRows = [], errors = [];
for (const row of sourceRows) {
  const plot = plotsByKey.get(`${row.unit}::${row.plantedYear}::${normalizePlotName(row.plotName)}`);
  if (!plot) { errors.push({ "Dòng nguồn": row.sourceRow, "Đội": row.unit, "Tên lô nguồn": row.plotName, "Lý do": "Không tìm thấy lô tương ứng trong hệ thống" }); continue; }
  const output = {
    "Mã lô": plot.code,
    "Ngày cập nhật": updateDate,
    "Tổng số hố kiểm kê": row.totalPits,
    "Tổng số cây kiểm kê": row.totalTrees,
    "Cây cạo": row.tappingTrees,
    "Cây chưa đủ tiêu chuẩn": row.immatureTrees,
    "Cây không hiệu quả": row.nonproductiveTrees,
    "Cây bệnh không cạo": row.diseasedTrees,
    "Cây khô miệng cạo": row.dryTappingTrees,
    "Hố trống": row.emptyPits,
    "Mật độ cây cạo/ha": row.tappingDensity === null ? null : Number(row.tappingDensity.toFixed(3)),
    "Xếp hạng vườn cây": row.plotRank,
  };
  importRows.push(output);
  mappingRows.push({ "Dòng nguồn": row.sourceRow, "Đội": row.unit, "Tên lô nguồn": row.plotName, "Năm trồng": row.plantedYear, "Giống": row.cultivar, "Diện tích nguồn (ha)": row.areaHa, "Mã lô import": plot.code, "Tên lô hệ thống": clean(plot.name), "Ngày cập nhật": updateDate, "Trạng thái": "Khớp" });
}
const outputBook = XLSX.utils.book_new();
const importSheet = XLSX.utils.json_to_sheet(importRows);
importSheet["!cols"] = [24, 18, 22, 22, 14, 27, 24, 25, 26, 14, 22, 22].map(wch => ({ wch }));
importSheet["!autofilter"] = { ref: `A1:L${importRows.length + 1}` };
XLSX.utils.book_append_sheet(outputBook, importSheet, "Chỉ số cây định kỳ");
const mappingSheet = XLSX.utils.json_to_sheet(mappingRows);
mappingSheet["!cols"] = [14, 12, 18, 14, 18, 22, 28, 28, 18, 14].map(wch => ({ wch }));
mappingSheet["!autofilter"] = { ref: `A1:J${mappingRows.length + 1}` };
XLSX.utils.book_append_sheet(outputBook, mappingSheet, "Đối chiếu nguồn");
const guideSheet = XLSX.utils.aoa_to_sheet([
  ["IMPORT CHỈ SỐ CÂY TỪ KIỂM KÊ 2026"],
  [`Ngày cập nhật của toàn bộ dữ liệu: ${updateDate}`],
  ["Dữ liệu được lấy từ sheet Chi tiết KK CSKD tại Campuchia và đã đối chiếu Mã lô với hệ thống."],
  ["Sheet Chỉ số cây định kỳ có thể chọn trực tiếp tại Import & Excel; sheet Đối chiếu nguồn dùng để kiểm tra, không import."],
  ["Không tự tạo số liệu: chỉ chuyển đúng các chỉ tiêu có trong file kiểm kê."],
]);
guideSheet["!cols"] = [{ wch: 125 }];
XLSX.utils.book_append_sheet(outputBook, guideSheet, "Hướng dẫn");
if (errors.length) XLSX.utils.book_append_sheet(outputBook, XLSX.utils.json_to_sheet(errors), "Dòng chưa khớp");
fs.writeFileSync(outputPath, XLSX.write(outputBook, { type: "buffer", bookType: "xlsx", compression: true }));
console.log(JSON.stringify({ outputPath, sourceRows: sourceRows.length, importRows: importRows.length, errors: errors.length, updateDate }));
