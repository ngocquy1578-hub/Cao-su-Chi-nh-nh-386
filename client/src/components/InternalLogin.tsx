import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function InternalLogin() { const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const utils = trpc.useUtils(); const login = trpc.internalAccounts.login.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Đăng nhập thành công"); } }); return <div className="space-y-3 text-left"><div><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Tên đăng nhập</label><Input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder="Ví dụ: doi1.truong" /></div><div><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Mật khẩu</label><Input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" /></div><Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={login.isPending} onClick={() => login.mutate({ username, password })}><KeyRound className="mr-2 h-4 w-4" />{login.isPending ? "Đang xác thực…" : "Đăng nhập nội bộ"}</Button>{login.error ? <p className="text-sm text-rose-600">{login.error.message}</p> : null}</div>; }
