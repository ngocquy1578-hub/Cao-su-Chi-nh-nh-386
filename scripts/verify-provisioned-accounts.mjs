import crypto from "crypto";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const rows = XLSX.utils.sheet_to_json(XLSX.readFile("/home/ubuntu/upload/danhsachdangnhap.xlsx").Sheets.Sheet1, { defval: "" });
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [accounts] = await connection.execute("SELECT ia.username, ia.passwordHash, ia.groupType, ia.scopeUnits, ia.isActive FROM internal_accounts ia");
  const byUsername = new Map(accounts.map(account => [account.username, account]));
  const verify = (password, stored) => { const [salt, hash] = stored.split(":"); return crypto.scryptSync(password, salt, 64).toString("hex") === hash; };
  for (const row of rows) { const username = String(row["Tên đăng nhập"] ?? "").trim().toLowerCase(); const account = byUsername.get(username); if (!account || account.isActive !== 1 || !verify(String(row["Mat khau"] ?? ""), account.passwordHash)) throw new Error(`Không xác minh được tài khoản ${username}`); }
  console.log(JSON.stringify({ verifiedAccounts: rows.length, activeAccounts: accounts.filter(account => account.isActive === 1).length }, null, 2));
} finally { await connection.end(); }
