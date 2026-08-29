import fs from "node:fs";
import XLSX from "xlsx";

const audit = JSON.parse(fs.readFileSync("/home/ubuntu/excel_audit.json", "utf8"));
const normalized = audit.normalized;
const template = XLSX.utils.book_new();
const headers = {
  "Vườn lô": ["Đơn vị", "Tên lô", "Năm trồng", "Giống", "Diện tích (ha)", "Tổng số hố kiểm kê", "Tổng số cây kiểm kê", "Cây cạo", "Mật độ cây cạo/ha", "Xếp hạng vườn cây"],
  "Nhân công": ["Đội", "Tên", "Tên phiên âm", "Giới tính", "Trạng thái làm việc"],
  "Nhập mủ": ["Đợt", "Ngày", "Đội", "Vườn", "Mủ đông, tạp (kg)", "Mủ dây (kg)"],
  "Xuất mủ": ["Đợt", "Ngày", "Đội", "Mủ đông, tạp (kg)", "Mủ dây (kg)"],
};
for (const [name, row] of Object.entries(headers)) {
  const sheet = XLSX.utils.aoa_to_sheet([row]);
  sheet["!cols"] = row.map(header => ({ wch: Math.max(14, header.length + 4) }));
  XLSX.utils.book_append_sheet(template, sheet, name);
}
const guide = XLSX.utils.aoa_to_sheet([["HƯỚNG DẪN IMPORT"], ["1. Chỉ điền dữ liệu dưới dòng tiêu đề của đúng sheet."], ["2. Giữ nguyên tên cột; các cột số sử dụng kg hoặc ha."], ["3. Hệ thống tự tính cộng nhập/cộng xuất từ hai cột khối lượng thành phần."], ["4. Lô vườn nhận diện theo mã được tạo từ Đơn vị + Năm trồng + Tên lô."], ["5. Dữ liệu trùng khóa sẽ được cập nhật, không tạo bản sao."]]);
guide["!cols"] = [{ wch: 100 }];
XLSX.utils.book_append_sheet(template, guide, "Hướng dẫn");
XLSX.writeFile(template, "/home/ubuntu/cao-su_excel_import_template.xlsx");

const exported = XLSX.utils.book_new();
const sheets = {
  "Vườn lô": normalized.plots.map(row => ({ "Đơn vị": row.unit, "Tên lô": row.lot_name, "Năm trồng": row.planted_year, Giống: row.cultivar, "Diện tích (ha)": row.area_ha, "Tổng số hố kiểm kê": row.inventory_pits, "Tổng số cây kiểm kê": row.inventory_trees, "Cây cạo": row.tapping_trees, "Mật độ cây cạo/ha": row.tapping_density, "Xếp hạng vườn cây": row.rank })),
  "Nhân công": normalized.workers.map(row => ({ Đội: row.unit, Tên: row.name, "Tên phiên âm": row.phonetic_name, "Giới tính": row.gender, "Trạng thái làm việc": row.status_source })),
  "Nhập mủ": normalized.imports.map(row => ({ Đợt: row.period, Ngày: row.record_date, Đội: row.unit, Vườn: row.garden, "Mủ đông, tạp (kg)": row.frozen_latex, "Mủ dây (kg)": row.latex_thread, "Cộng nhập (kg)": row.total })),
  "Xuất mủ": normalized.exports.map(row => ({ Đợt: row.period, Ngày: row.record_date, Đội: row.unit, "Mủ đông, tạp (kg)": row.frozen_contaminated_latex, "Mủ dây (kg)": row.latex_thread, "Cộng xuất (kg)": row.total })),
};
for (const [name, rows] of Object.entries(sheets)) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const first = rows[0] ?? {};
  sheet["!cols"] = Object.keys(first).map(key => ({ wch: Math.max(14, key.length + 4) }));
  XLSX.utils.book_append_sheet(exported, sheet, name);
}
XLSX.writeFile(exported, "/home/ubuntu/cao-su_excel_export_2026.xlsx");
console.log("Created import template and exported data workbooks");
