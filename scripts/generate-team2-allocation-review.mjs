import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const sourcePath = "/home/ubuntu/upload/1.PhanchiaVuoncay,lo.xlsx";
const outputPath = "/home/ubuntu/Downloads/Doi2_Phan_cong_Vuon_ABC_Doi_chieu.xlsx";

const normalizePlot = value => String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
const toNumber = value => Number(value ?? 0);
const fixed3 = value => Math.round(toNumber(value) * 1000) / 1000;

const sourceBook = XLSX.readFile(sourcePath, { cellDates: true });
const sourceSheet = sourceBook.Sheets["Đội 2"];
if (!sourceSheet) throw new Error("Không tìm thấy sheet Đội 2 trong file nguồn.");
const sourceRows = XLSX.utils.sheet_to_json(sourceSheet, { header: 1, defval: null })
  .filter(row => String(row[1] ?? "").trim() === "Đội 2")
  .map((row, index) => ({
    order: index + 1,
    plotLabel: normalizePlot(row[2]),
    plantedYear: Number(row[3]),
    areaHa: fixed3(row[4]),
  }));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [plots] = await connection.query(
  "SELECT code, name, plantedYear, areaHa, gardenType FROM plantation_plots WHERE unit = 'Đội 2' ORDER BY plantedYear, name"
);
const [workers] = await connection.query(
  "SELECT name, employeeCode, status FROM workers WHERE unit = 'Đội 2' ORDER BY name"
);
await connection.end();

const plotsByCode = new Map(plots.map(plot => [plot.code, plot]));
const allocationRows = sourceRows.map(source => {
  const expectedCode = `LO-DOI-2-${source.plantedYear}-${source.plotLabel}`;
  const systemPlot = plotsByCode.get(expectedCode);
  const sourceArea = fixed3(source.areaHa);
  const systemArea = systemPlot ? fixed3(systemPlot.areaHa) : null;
  const status = !systemPlot
    ? "Chưa có lô tương ứng trong hệ thống"
    : sourceArea !== systemArea
      ? "Chênh diện tích – cần kiểm tra"
      : "Khớp lô và diện tích – chờ phân công";
  return {
    "STT": source.order,
    "Nhân công": "",
    "Mã số nhân công": "",
    "Vườn A/B/C": systemPlot?.gardenType ?? "",
    "Mã lô": expectedCode,
    "Tên lô": `Lô ${source.plotLabel} (${source.plantedYear})`,
    "Năm trồng": source.plantedYear,
    "Hàng từ": "",
    "Hàng đến": "",
    "Diện tích (ha)": sourceArea,
    "Diện tích hệ thống (ha)": systemArea ?? "",
    "Trạng thái đối chiếu": status,
    "Ghi chú kiểm tra": "",
  };
});

const summaryRows = [
  { "Nội dung": "Đội", "Giá trị": "Đội 2" },
  { "Nội dung": "Số lô theo file nguồn", "Giá trị": sourceRows.length },
  { "Nội dung": "Tổng diện tích theo file nguồn (ha)", "Giá trị": fixed3(sourceRows.reduce((sum, row) => sum + row.areaHa, 0)) },
  { "Nội dung": "Số lô khớp trong hệ thống", "Giá trị": allocationRows.filter(row => row["Trạng thái đối chiếu"].startsWith("Khớp")).length },
  { "Nội dung": "Lưu ý", "Giá trị": "File nguồn chỉ có lô và diện tích. Các cột Nhân công, Vườn A/B/C, Hàng từ–đến được để rà soát/bổ sung trước khi cập nhật." },
];

const rosterRows = workers.map((worker, index) => ({
  "STT": index + 1,
  "Nhân công": worker.name ?? "",
  "Mã số nhân công": worker.employeeCode ?? "",
  "Trạng thái": worker.status === "active" ? "Hoạt động" : "Không hoạt động",
}));

const guideRows = [
  { "Bước": 1, "Hướng dẫn": "Kiểm tra từng dòng tại sheet Phân công Đội 2; chỉ sửa/bổ sung các cột Nhân công, Vườn A/B/C, Hàng từ, Hàng đến và Ghi chú kiểm tra." },
  { "Bước": 2, "Hướng dẫn": "Chọn Nhân công từ sheet Danh sách nhân công Đội 2; nếu một lô chia nhiều người, hãy sao chép thêm dòng và điền khoảng hàng riêng." },
  { "Bước": 3, "Hướng dẫn": "Giữ nguyên Mã lô, Năm trồng và Diện tích nếu không có số liệu xác nhận cần điều chỉnh." },
  { "Bước": 4, "Hướng dẫn": "Gửi lại file đã kiểm tra. Hệ thống chỉ cập nhật sau khi nhận được xác nhận của quản trị viên." },
];

const workbook = XLSX.utils.book_new();
const addSheet = (name, rows, widths, numberColumns = []) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = widths.map(width => ({ wch: width }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const header = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (header) header.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F766E" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
  }
  for (let row = 1; row <= range.e.r; row += 1) {
    numberColumns.forEach(col => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && typeof cell.v === "number") cell.z = "0.000";
    });
  }
  XLSX.utils.book_append_sheet(workbook, sheet, name);
};

addSheet("Phân công Đội 2", allocationRows, [6, 22, 18, 12, 26, 20, 11, 10, 10, 15, 22, 34, 30], [9, 10]);
addSheet("Danh sách nhân công Đội 2", rosterRows, [6, 28, 20, 18]);
addSheet("Tổng hợp đối chiếu", summaryRows, [35, 95], [1]);
addSheet("Hướng dẫn kiểm tra", guideRows, [8, 110]);

const allocationSheet = workbook.Sheets["Phân công Đội 2"];
allocationSheet["!autofilter"] = { ref: `A1:M${allocationRows.length + 1}` };
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath, { compression: true });
console.log(JSON.stringify({ outputPath, plots: allocationRows.length, workers: rosterRows.length, totalArea: summaryRows[2]["Giá trị"] }));
process.exit(0);
