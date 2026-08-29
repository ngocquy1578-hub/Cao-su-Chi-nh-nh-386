import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const outputPath = "/home/ubuntu/Downloads/Phan_chia_nhan_cong_vuon_cay_import.xlsx";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [workers] = await connection.query("SELECT unit, name, employeeCode FROM workers WHERE unit IN ('Đội 1','Đội 2','Đội 3','Đội 4','Đội 5','Đội 6') ORDER BY CAST(SUBSTRING_INDEX(unit, ' ', -1) AS UNSIGNED), name");
const [plots] = await connection.query("SELECT unit, gardenType, code, name, plantedYear, areaHa FROM plantation_plots WHERE unit IN ('Đội 1','Đội 2','Đội 3','Đội 4','Đội 5','Đội 6') ORDER BY CAST(SUBSTRING_INDEX(unit, ' ', -1) AS UNSIGNED), plantedYear, name");
await connection.end();

const workbook = XLSX.utils.book_new();
const sheet = {};
const setCell = (address, value, style) => { sheet[address] = { v: value, t: typeof value === "number" ? "n" : "s", s: style }; };
const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F766E" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "thin", color: { rgb: "D1FAE5" } }, bottom: { style: "thin", color: { rgb: "D1FAE5" } }, left: { style: "thin", color: { rgb: "D1FAE5" } }, right: { style: "thin", color: { rgb: "D1FAE5" } } } };
const groupStyles = { A: { ...headerStyle, fill: { fgColor: { rgb: "047857" } } }, B: { ...headerStyle, fill: { fgColor: { rgb: "2563EB" } } }, C: { ...headerStyle, fill: { fgColor: { rgb: "7C3AED" } } } };
const inputStyle = { fill: { fgColor: { rgb: "FEF3C7" } }, border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } } };
const systemStyle = { fill: { fgColor: { rgb: "F1F5F9" } }, border: { bottom: { style: "thin", color: { rgb: "E5E7EB" } } } };

setCell("A1", "STT", headerStyle); setCell("B1", "Đội", headerStyle); setCell("C1", "Nhân công (tên La tinh)", headerStyle); setCell("D1", "Mã số nhân công", headerStyle);
[["A", 5, 10], ["B", 11, 16], ["C", 17, 22]].forEach(([garden, start, end]) => {
  const startCol = XLSX.utils.encode_col(start - 1); const endCol = XLSX.utils.encode_col(end - 1);
  setCell(`${startCol}1`, `Vườn ${garden}`, groupStyles[garden]);
  ["Mã lô", "Tên lô", "Năm trồng", "Từ hàng", "Đến hàng", "Diện tích (ha)"].forEach((label, index) => setCell(`${XLSX.utils.encode_col(start - 1 + index)}2`, label, groupStyles[garden]));
});
workers.forEach((worker, index) => {
  const row = index + 3;
  setCell(`A${row}`, index + 1, systemStyle); setCell(`B${row}`, worker.unit, systemStyle); setCell(`C${row}`, worker.name, systemStyle); setCell(`D${row}`, worker.employeeCode ?? "", systemStyle);
  for (let col = 4; col < 22; col += 1) setCell(`${XLSX.utils.encode_col(col)}${row}`, "", col % 6 === 4 || col % 6 === 5 || col % 6 === 3 ? inputStyle : systemStyle);
});
sheet["!ref"] = `A1:V${workers.length + 2}`;
sheet["!merges"] = ["A1:A2", "B1:B2", "C1:C2", "D1:D2", "E1:J1", "K1:P1", "Q1:V1"].map(XLSX.utils.decode_range);
sheet["!cols"] = [6, 12, 30, 18, 26, 22, 12, 12, 12, 16, 26, 22, 12, 12, 12, 16, 26, 22, 12, 12, 12, 16].map(wch => ({ wch }));
sheet["!rows"] = [{ hpt: 26 }, { hpt: 30 }];
sheet["!autofilter"] = { ref: `A2:V${workers.length + 2}` };
XLSX.utils.book_append_sheet(workbook, sheet, "Phân chia nhân công");

const plotRows = plots.map((plot, index) => ({ "STT": index + 1, "Đội": plot.unit, "Vườn A/B/C hiện tại": plot.gardenType ?? "", "Mã lô": plot.code, "Tên lô": plot.name, "Năm trồng": plot.plantedYear ?? "", "Diện tích (ha)": Number(plot.areaHa) }));
const plotSheet = XLSX.utils.json_to_sheet(plotRows);
plotSheet["!cols"] = [6, 12, 20, 28, 24, 14, 18].map(wch => ({ wch }));
plotSheet["!autofilter"] = { ref: `A1:G${plotRows.length + 1}` };
XLSX.utils.book_append_sheet(workbook, plotSheet, "Danh mục lô hệ thống");

const guide = XLSX.utils.aoa_to_sheet([
  ["HƯỚNG DẪN IMPORT PHÂN CHIA NHÂN CÔNG VƯỜN CÂY"],
  ["1. Sheet Phân chia nhân công đã có sẵn Đội 1–6, tên La tinh và mã số nhân công từ hệ thống."],
  ["2. Chỉ điền Mã lô, Từ hàng, Đến hàng và Diện tích trong đúng nhóm Vườn A/B/C. Tên lô và Năm trồng được hệ thống đối chiếu theo Mã lô."],
  ["3. Một nhân công có thể có tối đa một dòng tại mỗi nhóm Vườn A, B, C. Nếu cần phân nhiều khoảng hàng cùng một vườn, sử dụng thêm dòng nhân công tương ứng."],
  ["4. Mã lô phải tồn tại trong sheet Danh mục lô hệ thống, đúng Đội. Hệ thống từ chối mã lô sai, nhân công sai hoặc Hàng từ lớn hơn Hàng đến."],
  ["5. Khi import, hệ thống ghi nhận phân chia và tự cập nhật Vườn A/B/C cho lô nếu lô chưa được phân loại. Không cập nhật khi lô đã thuộc loại vườn khác."],
]);
guide["!cols"] = [{ wch: 125 }];
XLSX.utils.book_append_sheet(workbook, guide, "Hướng dẫn import");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath, { compression: true });
console.log(JSON.stringify({ outputPath, workers: workers.length, plots: plots.length }));
process.exit(0);
