import crypto from "crypto";
import type { Request } from "express";
import { ENV } from "./_core/env";

const COOKIE = "cn386_internal_session";
const secret = () => Buffer.from(ENV.cookieSecret || "cn386-development-session-secret", "utf8");
const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

export function hashPassword(password: string) { const salt = crypto.randomBytes(16).toString("hex"); const hash = crypto.scryptSync(password, salt, 64).toString("hex"); return `${salt}:${hash}`; }
export function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const derived = crypto.scryptSync(password, salt, 64); const target = Buffer.from(hash, "hex"); return target.length === derived.length && crypto.timingSafeEqual(target, derived); }
export function sessionToken(userId: number) { const payload = encode(JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 12 })); const signature = crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); return `${payload}.${signature}`; }
export function sessionUserId(req: Request) { const value = req.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1); if (!value) return null; const [payload, signature] = value.split("."); if (!payload || !signature) return null; const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const data = JSON.parse(decode(payload)); return typeof data.userId === "number" && data.exp > Date.now() ? data.userId : null; } catch { return null; } }
export const internalSessionCookie = (token: string) => ({ name: COOKIE, value: token, options: { httpOnly: true, sameSite: "lax" as const, secure: ENV.isProduction, path: "/", maxAge: 1000 * 60 * 60 * 12 } });
export const clearInternalSessionCookie = () => ({ name: COOKIE, options: { httpOnly: true, sameSite: "lax" as const, secure: ENV.isProduction, path: "/", maxAge: -1 } });
