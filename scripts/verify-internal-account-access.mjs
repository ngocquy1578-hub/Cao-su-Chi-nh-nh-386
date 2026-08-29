import mysql from "mysql2/promise";
import XLSX from "xlsx";

const rows = XLSX.utils.sheet_to_json(XLSX.readFile("/home/ubuntu/upload/danhsachdangnhap.xlsx").Sheets.Sheet1, { defval: "" });
const category = { "KH-KD": "kh_kd", "CT": "ct", "TC-LĐ": "tc_ld", "TC-KT": "tc_kt", "TM-HC": "tm_hc", "HC-KT": "hc_kt" };
const allRead = ["dashboard:read", "reports:read", "warehouse:read", "care:read", "workers:read"];
const fullOperational = [...allRead, "care:write", "latex:write"];
const expected = row => { const group = String(row["Nhóm"]); const role = String(row["Vai trò"]); const scope = String(row["Phạm vi"]); if (group === "Ban Giám đốc") return { groupType: "board", roleCode: role === "Giám đốc" ? "system_admin" : "director", scope: [], permissions: fullOperational }; if (group === "Đội sản xuất") return { groupType: "production", roleCode: role === "Đội trưởng" ? "team_leader" : role === "Đội phó" ? "team_deputy" : "statistician", scope: [scope.match(/Đội\s*\d+/i)?.[0]?.replace(/\s+/g, " ")], permissions: fullOperational }; return { groupType: "functional", roleCode: category[group], scope: [], permissions: group === "KH-KD" || group === "TC-LĐ" ? fullOperational : allRead }; };
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [accounts] = await connection.execute("SELECT username,groupType,roleCode,scopeUnits,permissionProfile,isActive FROM internal_accounts ORDER BY username");
  if (accounts.length !== rows.length) throw new Error(`Số tài khoản không khớp: ${accounts.length}/${rows.length}`);
  const map = new Map(accounts.map(row => [row.username, row]));
  for (const row of rows) { const username = String(row["Tên đăng nhập"]).trim().toLowerCase(); const account = map.get(username); const required = expected(row); if (!account || account.isActive !== 1 || account.groupType !== required.groupType || account.roleCode !== required.roleCode || JSON.stringify(JSON.parse(account.scopeUnits)) !== JSON.stringify(required.scope) || JSON.stringify(JSON.parse(account.permissionProfile)) !== JSON.stringify(required.permissions)) throw new Error(`Sai quyền hoặc phạm vi của ${username}`); }
} finally { await connection.end(); }

const samples = ["quannh386", "duync386", "longnq386"];
for (const username of samples) { const row = rows.find(item => String(item["Tên đăng nhập"]).trim().toLowerCase() === username); const response = await fetch("http://localhost:3000/api/trpc/internalAccounts.login?batch=1", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ 0: { json: { username, password: String(row["Mat khau"]) } } }) }); const text = await response.text(); if (!response.ok || text.includes("error") || !response.headers.get("set-cookie")?.includes("cn386_internal_session")) throw new Error(`Đăng nhập HTTP không thành công cho ${username}`); }
console.log(JSON.stringify({ verifiedAccounts: rows.length, verifiedLoginGroups: ["board", "functional", "production"] }, null, 2));
