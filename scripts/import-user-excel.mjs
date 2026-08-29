import mysql from "mysql2/promise";
import XLSX from "xlsx";

const root = "/home/ubuntu/upload";
const files = {
  plots: `${root}/pasted_file_FASIX0_1.import-Vuoncay,lo.xlsx`,
  workers: `${root}/pasted_file_N2WKDH_2.import_nhancong.xlsx`,
  imports: `${root}/pasted_file_ABWdnd_3.1.import_nhap_mu.xlsx`,
  exports: `${root}/pasted_file_RNIhRp_3.2.import_xuat_mu.xlsx`,
};

const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const number = value => Number(String(value ?? "0").replaceAll(",", "").trim()) || 0;
const date = value => {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const raw = clean(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split("-");
  if (parts.length === 3) return `20${parts[2].padStart(2, "0")}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  throw new Error(`Không đọc được ngày: ${raw}`);
};
const codePart = value => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toUpperCase();
const sheetRows = (file, sheet, range = 0) => XLSX.utils.sheet_to_json(XLSX.readFile(file, { cellDates: false }).Sheets[sheet], { header: 1, defval: "", range });

function parsePlots() {
  return sheetRows(files.plots, "Sheet1", 2).filter(row => clean(row[0])).map(row => ({
    code: `LO-${codePart(row[1])}-${codePart(row[3])}-${codePart(row[2])}`.slice(0, 48),
    name: `Lô ${clean(row[2])} (${clean(row[3])})`, unit: clean(row[1]), areaHa: number(row[5]), plantedYear: Number(row[3]) || null,
    cultivar: clean(row[4]) || null, inventoryPits: number(row[6]) || null, inventoryTrees: number(row[7]) || null,
    tappingTrees: number(row[8]) || null, tappingDensity: number(row[19]) || null, plotRank: clean(row[20]) || null,
    note: [`Giống: ${clean(row[4]) || "—"}`, `Hố kiểm kê: ${number(row[6]).toLocaleString("vi-VN")}`, `Cây kiểm kê: ${number(row[7]).toLocaleString("vi-VN")}`, `Cây cạo: ${number(row[8]).toLocaleString("vi-VN")}`, `Xếp hạng: ${clean(row[20]) || "—"}`].join(" · "),
  })).filter(row => row.unit && row.areaHa > 0);
}

function parseWorkers() {
  const status = { "Đang làm việc": "active", "Tạm nghỉ": "inactive", "Nghỉ việc": "inactive" };
  return sheetRows(files.workers, "Nhân công", 1).filter(row => clean(row[0]) && clean(row[1])).map(row => ({
    unit: clean(row[0]), name: clean(row[1]), phoneticName: clean(row[2]) || null, gender: clean(row[3]) === "Nữ" ? "female" : "male",
    status: status[clean(row[4])] ?? "inactive", roleTitle: "Công nhân khai thác",
    note: [`Giới tính nguồn: ${clean(row[3]) || "Nam"}`, `Trạng thái nguồn: ${clean(row[4]) || "Đang làm việc"}`].join(" · "),
  }));
}

function parseImports() {
  return sheetRows(files.imports, "Nhap mu", 1).filter(row => clean(row[0]) && clean(row[2]) && clean(row[3])).map(row => ({
    periodLabel: clean(row[0]), recordDate: date(row[1]), unit: clean(row[2]), gardenName: clean(row[3]), frozenLatex: number(row[4]), latexThread: number(row[5]),
  }));
}

function parseExports() {
  return sheetRows(files.exports, "Xuat mu", 1).filter(row => clean(row[0]) && clean(row[2])).map(row => ({
    periodLabel: clean(row[0]), recordDate: date(row[1]), unit: clean(row[2]), frozenContaminatedLatex: number(row[3]), latexThread: number(row[4]),
  }));
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [existingUsers] = await connection.execute("SELECT id FROM users ORDER BY id LIMIT 1");
if (!existingUsers.length) throw new Error("Chưa có tài khoản quản trị để gán người tạo dữ liệu");
const createdBy = existingUsers[0].id;
const [plots, workers, imports, exports] = [parsePlots(), parseWorkers(), parseImports(), parseExports()];

await connection.beginTransaction();
try {
  for (const row of plots) await connection.execute(
    "INSERT INTO plantation_plots (code,name,unit,areaHa,note,plantedYear,cultivar,inventoryPits,inventoryTrees,tappingTrees,tappingDensity,plotRank,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), unit=VALUES(unit), areaHa=VALUES(areaHa), note=VALUES(note), plantedYear=VALUES(plantedYear), cultivar=VALUES(cultivar), inventoryPits=VALUES(inventoryPits), inventoryTrees=VALUES(inventoryTrees), tappingTrees=VALUES(tappingTrees), tappingDensity=VALUES(tappingDensity), plotRank=VALUES(plotRank)",
    [row.code, row.name, row.unit, row.areaHa, row.note, row.plantedYear, row.cultivar, row.inventoryPits, row.inventoryTrees, row.tappingTrees, row.tappingDensity, row.plotRank, createdBy],
  );
  for (const row of workers) await connection.execute(
    "INSERT INTO workers (name,unit,phoneticName,gender,roleTitle,status,note,createdBy) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE phoneticName=VALUES(phoneticName), gender=VALUES(gender), roleTitle=VALUES(roleTitle), status=VALUES(status), note=VALUES(note)",
    [row.name, row.unit, row.phoneticName, row.gender, row.roleTitle, row.status, row.note, createdBy],
  );
  for (const row of imports) await connection.execute(
    "INSERT INTO team_latex_imports (unit,gardenName,periodLabel,recordDate,frozenLatex,latexThread,createdBy) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE periodLabel=VALUES(periodLabel), frozenLatex=VALUES(frozenLatex), latexThread=VALUES(latexThread)",
    [row.unit, row.gardenName, row.periodLabel, row.recordDate, row.frozenLatex, row.latexThread, createdBy],
  );
  for (const row of exports) await connection.execute(
    "INSERT INTO team_latex_exports (unit,periodLabel,recordDate,frozenContaminatedLatex,latexThread,createdBy) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE periodLabel=VALUES(periodLabel), frozenContaminatedLatex=VALUES(frozenContaminatedLatex), latexThread=VALUES(latexThread)",
    [row.unit, row.periodLabel, row.recordDate, row.frozenContaminatedLatex, row.latexThread, createdBy],
  );
  await connection.commit();
  console.log(JSON.stringify({ imported: { plots: plots.length, workers: workers.length, teamImports: imports.length, teamExports: exports.length }, createdBy }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
