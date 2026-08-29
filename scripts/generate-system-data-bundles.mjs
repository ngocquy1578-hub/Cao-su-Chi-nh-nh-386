import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import * as XLSX from "xlsx";

const projectRoot = process.cwd();
const stagingRoot = path.join(projectRoot, ".bundle-staging");
const importRoot = path.join(stagingRoot, "Bo_file_Import_Cao_su_CN386");
const exportRoot = path.join(stagingRoot, "Bo_file_Export_Cao_su_CN386");

const clean = value => value == null ? "" : value instanceof Date ? value.toISOString().slice(0, 10) : value;
const writeWorkbook = async (filename, sheets) => {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of sheets) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, clean(value)])))), name.slice(0, 31));
  await fs.writeFile(filename, XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
};
const writeText = (filename, content) => fs.writeFile(filename, content, "utf8");
const parseMetadata = value => { try { return value ? JSON.parse(value) : {}; } catch { return {}; } };

await fs.rm(stagingRoot, { recursive: true, force: true });
await fs.mkdir(importRoot, { recursive: true });
await fs.mkdir(exportRoot, { recursive: true });
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const query = async sql => (await connection.query(sql))[0];

const [plots, workers, teamImports, teamExports, careRecords, allocations, activityLogs, internalAccounts, monthlySnapshots, teamSnapshots] = await Promise.all([
  query("SELECT code, name, unit, gardenType AS garden_type, areaHa AS area_ha, rowStart AS row_start, rowEnd AS row_end, plantedYear AS planted_year, cultivar, inventoryPits AS inventory_pits, inventoryTrees AS inventory_trees, tappingTrees AS tapping_trees, immatureTrees AS immature_trees, nonproductiveTrees AS nonproductive_trees, diseasedTrees AS diseased_trees, dryTappingTrees AS dry_tapping_trees, emptyPits AS empty_pits, tappingDensity AS tapping_density, indicatorDate AS indicator_date, plotRank AS plot_rank FROM plantation_plots ORDER BY unit, code"),
  query("SELECT unit, name, employeeCode AS employee_code, phoneticName AS phonetic_name, gender, status FROM workers ORDER BY unit, name"),
  query("SELECT periodLabel AS period_label, recordDate AS record_date, unit, gardenName AS garden_name, frozenLatex AS frozen_latex, latexThread AS latex_thread FROM team_latex_imports ORDER BY recordDate, unit, gardenName"),
  query("SELECT periodLabel AS period_label, recordDate AS record_date, unit, frozenContaminatedLatex AS frozen_contaminated_latex, latexThread AS latex_thread FROM team_latex_exports ORDER BY recordDate, unit"),
  query("SELECT * FROM daily_care_records ORDER BY activityDate, unit"),
  query("SELECT w.unit, w.name AS worker_name, w.employeeCode AS employee_code, a.gardenType AS garden_type, p.code AS plot_code, p.name AS plot_name, a.rowStart AS row_start, a.rowEnd AS row_end, a.areaHa AS area_ha FROM worker_plot_allocations a INNER JOIN workers w ON w.id=a.workerId INNER JOIN plantation_plots p ON p.id=a.plotId ORDER BY w.unit, w.name, p.code"),
  query("SELECT userId AS user_id, username, displayName AS display_name, eventType AS event_type, entityType AS entity_type, summary, metadata, createdAt AS created_at FROM activity_logs ORDER BY createdAt DESC"),
  query("SELECT ia.username, ia.displayName AS display_name, ia.groupType AS group_type, ia.roleCode AS role_code, ia.scopeUnits AS scope_units, ia.permissionProfile AS permission_profile, ia.isActive AS is_active, ia.createdAt AS created_at FROM internal_accounts ia ORDER BY ia.displayName"),
  query("SELECT monthKey AS month_key, activeCount AS active_count, totalCount AS total_count FROM workforce_monthly_snapshots ORDER BY monthKey"),
  query("SELECT monthKey AS month_key, unit, activeCount AS active_count, totalCount AS total_count FROM workforce_team_monthly_snapshots ORDER BY monthKey, unit"),
]);

const plotImport = plots.map(plot => ({
  "Mã lô": plot.code, "Tên lô": plot.name, "Đơn vị": plot.unit, "Loại vườn": plot.garden_type ?? "", "Từ hàng": plot.row_start ?? "", "Đến hàng": plot.row_end ?? "", "Diện tích (ha)": plot.area_ha, "Năm trồng": plot.planted_year ?? "", "Giống": plot.cultivar ?? "", "Tổng số hố kiểm kê": plot.inventory_pits ?? "", "Tổng số cây kiểm kê": plot.inventory_trees ?? "", "Cây cạo": plot.tapping_trees ?? "", "Mật độ cây cạo/ha": plot.tapping_density ?? "", "Xếp hạng vườn cây": plot.plot_rank ?? "",
}));
const indicatorImport = plots.map(plot => ({
  "Mã lô": plot.code, "Ngày cập nhật": clean(plot.indicator_date), "Tổng số hố kiểm kê": plot.inventory_pits ?? "", "Tổng số cây kiểm kê": plot.inventory_trees ?? "", "Cây cạo": plot.tapping_trees ?? "", "Cây chưa đủ tiêu chuẩn": plot.immature_trees ?? "", "Cây không hiệu quả": plot.nonproductive_trees ?? "", "Cây bệnh không cạo": plot.diseased_trees ?? "", "Cây khô miệng cạo": plot.dry_tapping_trees ?? "", "Hố trống": plot.empty_pits ?? "", "Mật độ cây cạo/ha": plot.tapping_density ?? "", "Xếp hạng vườn cây": plot.plot_rank ?? "",
}));
const workerImport = workers.map(worker => ({ "Đội": worker.unit ?? "", "Tên": worker.name, "Mã số": worker.employee_code ?? "", "Tên phiên âm": worker.phonetic_name ?? "", "Giới tính": worker.gender === "female" ? "Nữ" : "Nam", "Trạng thái làm việc": worker.status === "active" ? "Đang làm việc" : "Không hoạt động" }));
const latexImport = teamImports.map(row => ({ "Đợt": row.period_label, "Ngày": clean(row.record_date), "Đội": row.unit, "Vườn": row.garden_name, "Mủ đông, tạp (kg)": row.frozen_latex, "Mủ dây (kg)": row.latex_thread }));
const latexExport = teamExports.map(row => ({ "Đợt": row.period_label, "Ngày": clean(row.record_date), "Đội": row.unit, "Mủ đông, tạp (kg)": row.frozen_contaminated_latex, "Mủ dây (kg)": row.latex_thread }));
const workerCodes = workers.map(worker => ({ "Đội": worker.unit ?? "", "Tên phiên âm": worker.phonetic_name ?? worker.name, "Mã số": worker.employee_code ?? "" }));
const allocationTemplate = workers.map((worker, index) => ({ "STT": index + 1, "Đội": worker.unit ?? "", "Nhân công": worker.name, "Mã số nhân công": worker.employee_code ?? "", "Vườn A/B/C": "", "Mã lô": "", "Từ hàng": "", "Đến hàng": "", "Diện tích (ha)": "" }));

await writeWorkbook(path.join(importRoot, "01_Vuon_lo_import.xlsx"), [["Vườn lô", plotImport]]);
await writeWorkbook(path.join(importRoot, "02_Chi_so_cay_import.xlsx"), [["Chỉ số cây định kỳ", indicatorImport]]);
await writeWorkbook(path.join(importRoot, "03_Nhan_cong_import.xlsx"), [["Nhân công", workerImport]]);
await writeWorkbook(path.join(importRoot, "04_Nhap_mu_theo_doi_import.xlsx"), [["Nhập mủ theo Đội", latexImport]]);
await writeWorkbook(path.join(importRoot, "05_Xuat_mu_theo_doi_import.xlsx"), [["Xuất mủ theo Đội", latexExport]]);
await writeWorkbook(path.join(importRoot, "06_Ma_nhan_cong_import.xlsx"), [["Mã nhân công", workerCodes]]);
await writeWorkbook(path.join(importRoot, "07_Phan_cong_nhan_cong_vuon_cay_import.xlsx"), [["Phân công nhân công", allocationTemplate]]);
await writeText(path.join(importRoot, "README_IMPORT.md"), "# Bộ file Import Cao su CN386\n\nMỗi file Excel dùng đúng tiêu đề cột của hệ thống. Dữ liệu lô, chỉ số cây, nhân công, nhập mủ và xuất mủ có thể tái nhập trực tiếp. File phân công nhân công là mẫu để điền trước khi import; cần có Mã lô, Từ hàng, Đến hàng và Diện tích. Không thay đổi tên sheet hoặc tiêu đề cột.\n");

const careByCategory = ["tapping", "reinforcement", "care", "treatment"].map(category => [category, careRecords.filter(row => row.category === category)]);
const history = activityLogs.filter(row => row.event_type === "plot.garden_type.bulk_assign").map(row => ({ "Thời điểm": clean(row.created_at), "Người thao tác": row.display_name ?? "", "Tên đăng nhập": row.username ?? "", "Nội dung": row.summary, ...Object.fromEntries(Object.entries(parseMetadata(row.metadata)).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])) }));
const accountExport = internalAccounts.map(account => ({ "Tên đăng nhập": account.username, "Tên hiển thị": account.display_name, "Nhóm": account.group_type, "Vai trò": account.role_code, "Phạm vi Đội": account.scope_units, "Quyền": account.permission_profile, "Hoạt động": account.is_active === 1 ? "Có" : "Không", "Ngày tạo": clean(account.created_at) }));

await writeWorkbook(path.join(exportRoot, "01_Vuon_lo.xlsx"), [["Vườn lô", plotImport]]);
await writeWorkbook(path.join(exportRoot, "02_Chi_so_cay.xlsx"), [["Chỉ số cây", indicatorImport]]);
await writeWorkbook(path.join(exportRoot, "03_Nhan_cong.xlsx"), [["Nhân công", workerImport]]);
await writeWorkbook(path.join(exportRoot, "04_Nhap_mu_theo_doi.xlsx"), [["Nhập mủ theo Đội", latexImport]]);
await writeWorkbook(path.join(exportRoot, "05_Xuat_mu_theo_doi.xlsx"), [["Xuất mủ theo Đội", latexExport]]);
await writeWorkbook(path.join(exportRoot, "06_Theo_doi_hang_ngay.xlsx"), careByCategory.map(([category, rows]) => [category, rows]));
await writeWorkbook(path.join(exportRoot, "07_Phan_cong_nhan_cong_vuon_cay.xlsx"), [["Phân công", allocations]]);
await writeWorkbook(path.join(exportRoot, "08_Lich_su_phan_bo_lo.xlsx"), [["Lịch sử", history]]);
await writeWorkbook(path.join(exportRoot, "09_Snapshot_nhan_cong_thang.xlsx"), [["Tổng công ty", monthlySnapshots], ["Theo Đội", teamSnapshots]]);
await writeWorkbook(path.join(exportRoot, "10_Nhat_ky_hoat_dong.xlsx"), [["Nhật ký", activityLogs.map(row => ({ "Thời điểm": clean(row.created_at), "Người thao tác": row.display_name ?? "", "Tên đăng nhập": row.username ?? "", "Sự kiện": row.event_type, "Đối tượng": row.entity_type, "Nội dung": row.summary, "Siêu dữ liệu": row.metadata ?? "" }))]]);
await writeWorkbook(path.join(exportRoot, "11_Tai_khoan_noi_bo_da_an_nhay_cam.xlsx"), [["Tài khoản", accountExport]]);
await fs.copyFile(path.join(projectRoot, "system_audit_notes.md"), path.join(exportRoot, "12_Bao_cao_ra_soat_he_thong.md"));
await writeText(path.join(exportRoot, "README_EXPORT.md"), "# Bộ file Export Cao su CN386\n\nBộ export chứa dữ liệu thực có trong hệ thống tại thời điểm trích xuất. File tài khoản nội bộ đã loại bỏ mật khẩu băm và mọi bí mật. File Nhật ký hoạt động phục vụ truy vết; file Báo cáo rà soát tóm tắt kiểm tra tính toàn vẹn, tương thích import/export và bản vá đã thực hiện.\n");

await connection.end();
console.log(JSON.stringify({ importFiles: (await fs.readdir(importRoot)).length, exportFiles: (await fs.readdir(exportRoot)).length, importRoot, exportRoot }, null, 2));
