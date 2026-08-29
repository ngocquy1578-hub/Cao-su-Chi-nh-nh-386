import crypto from "crypto";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const file = "/home/ubuntu/upload/danhsachdangnhap.xlsx";
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const hashPassword = password => { const salt = crypto.randomBytes(16).toString("hex"); return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`; };
const allRead = ["dashboard:read", "reports:read", "warehouse:read", "care:read", "workers:read"];
const fullOperational = [...allRead, "care:write", "latex:write"];
const category = { "KH-KD": "kh_kd", "CT": "ct", "TC-LĐ": "tc_ld", "TC-KT": "tc_kt", "TM-HC": "tm_hc", "HC-KT": "hc_kt" };
const book = XLSX.readFile(file, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: "" });
const accounts = rows.map(row => {
  const name = clean(row["Họ và tên"]); const groupLabel = clean(row["Nhóm"]); const roleLabel = clean(row["Vai trò"]); const scopeLabel = clean(row["Phạm vi"]); const username = clean(row["Tên đăng nhập"]).toLowerCase(); const password = clean(row["Mat khau"]);
  if (!name || !username || !password) throw new Error(`Thiếu tên, tên đăng nhập hoặc mật khẩu ở dòng ${name || username || "không xác định"}`);
  if (!/^[a-z0-9._-]+$/.test(username)) throw new Error(`Tên đăng nhập không hợp lệ: ${username}`);
  let groupType = "functional"; let roleCode = category[groupLabel] ?? "functional"; let permissions = allRead; let scopeUnits = [];
  if (groupLabel === "Ban Giám đốc") { groupType = "board"; roleCode = roleLabel === "Giám đốc" ? "system_admin" : "director"; permissions = fullOperational; }
  if (groupLabel === "Đội sản xuất") { groupType = "production"; roleCode = roleLabel === "Đội trưởng" ? "team_leader" : roleLabel === "Đội phó" ? "team_deputy" : "statistician"; permissions = fullOperational; const unit = scopeLabel.match(/Đội\s*\d+/i)?.[0]?.replace(/\s+/g, " "); if (!unit) throw new Error(`Không xác định phạm vi đội cho ${name}`); scopeUnits = [unit]; }
  if (groupLabel !== "Ban Giám đốc" && groupLabel !== "Đội sản xuất" && !category[groupLabel]) throw new Error(`Nhóm không xác định: ${groupLabel}`);
  if (groupLabel === "KH-KD" || groupLabel === "TC-LĐ") permissions = fullOperational;
  return { name, username, password, groupType, roleCode, permissions, scopeUnits };
});
if (new Set(accounts.map(row => row.username)).size !== accounts.length) throw new Error("Danh sách vẫn có tên đăng nhập trùng");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [admins] = await connection.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
if (!admins.length) throw new Error("Không tìm thấy quản trị viên để ghi nhận người cấp tài khoản");
const createdBy = admins[0].id;
await connection.beginTransaction();
try {
  for (const account of accounts) {
    const role = account.roleCode === "system_admin" ? "admin" : "user";
    await connection.execute("INSERT INTO users (openId,name,loginMethod,role,lastSignedIn) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE name=VALUES(name), loginMethod='internal', role=VALUES(role)", [`local:${account.username}`, account.name, "internal", role]);
    const [users] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [`local:${account.username}`]);
    const userId = users[0].id;
    await connection.execute("INSERT INTO internal_accounts (userId,username,passwordHash,displayName,groupType,roleCode,scopeUnits,permissionProfile,isActive,createdBy) VALUES (?,?,?,?,?,?,?,?,1,?) ON DUPLICATE KEY UPDATE passwordHash=VALUES(passwordHash), displayName=VALUES(displayName), groupType=VALUES(groupType), roleCode=VALUES(roleCode), scopeUnits=VALUES(scopeUnits), permissionProfile=VALUES(permissionProfile), isActive=1", [userId, account.username, hashPassword(account.password), account.name, account.groupType, account.roleCode, JSON.stringify(account.scopeUnits), JSON.stringify(account.permissions), createdBy]);
  }
  await connection.commit();
  console.log(JSON.stringify({ provisioned: accounts.length, groups: Object.fromEntries(Object.entries(accounts.reduce((out, row) => { out[row.groupType] = (out[row.groupType] ?? 0) + 1; return out; }, {}))) }, null, 2));
} catch (error) { await connection.rollback(); throw error; } finally { await connection.end(); }
