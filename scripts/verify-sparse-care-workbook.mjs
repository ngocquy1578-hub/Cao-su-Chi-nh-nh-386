import mysql from "mysql2/promise";
import * as XLSX from "xlsx";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [records] = await connection.execute("SELECT activityDate, unit, gardenName, areaHa, tappingSection, workContent, planQuantity, actualQuantity, cumulativeQuantity, metricUnit, progressPercent FROM daily_care_records WHERE category = 'tapping' ORDER BY unit");
await connection.end();
const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.json_to_sheet(records.map(row => ({ Ngày: row.activityDate, Đội: row.unit, Vườn: row.gardenName, "Diện tích (ha)": Number(row.areaHa), "Phần cạo": row.tappingSection, "Nội dung": row.workContent ?? "", KH: Number(row.planQuantity), TH: Number(row.actualQuantity), "Lũy kế": Number(row.cumulativeQuantity), "Đơn vị tính": row.metricUnit, "% hoàn thành": Number(row.progressPercent) })));
XLSX.utils.book_append_sheet(workbook, sheet, "Theo dõi cạo mủ");
const output = "/home/ubuntu/tong-hop-cham-soc-mot-nhom.xlsx";
XLSX.writeFile(workbook, output);
console.log(JSON.stringify({ output, sheets: workbook.SheetNames, records: records.length }));
