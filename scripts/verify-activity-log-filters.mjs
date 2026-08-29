import XLSX from "xlsx";

const rows = XLSX.utils.sheet_to_json(XLSX.readFile("/home/ubuntu/upload/danhsachdangnhap.xlsx").Sheets.Sheet1, { defval: "" });
const admin = rows.find(row => String(row["Tên đăng nhập"]).trim().toLowerCase() === "quannh386");
if (!admin) throw new Error("Không tìm thấy tài khoản admin kiểm thử");
const login = await fetch("http://localhost:3000/api/trpc/internalAccounts.login?batch=1", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ 0: { json: { username: "quannh386", password: String(admin["Mat khau"]) } } }) });
const cookie = login.headers.get("set-cookie")?.split(";")[0];
if (!login.ok || !cookie) throw new Error("Không thể tạo phiên admin để kiểm thử nhật ký");
const input = encodeURIComponent(JSON.stringify({ 0: { json: { username: "quannh386", startDate: "2026-08-22", endDate: "2026-08-22", limit: 100 } } }));
const result = await fetch(`http://localhost:3000/api/trpc/activity.list?batch=1&input=${input}`, { headers: { cookie } });
if (!result.ok) throw new Error("Không thể đọc nhật ký đã lọc");
const body = await result.json();
const logs = body[0]?.result?.data?.json ?? [];
if (!logs.length || logs.some(log => log.username !== "quannh386")) throw new Error("Bộ lọc theo tài khoản hoặc thời gian không đúng");
console.log(JSON.stringify({ filteredLogs: logs.length, username: "quannh386", date: "2026-08-22" }, null, 2));
