import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./internalAuth";

describe("internal password security", () => {
  it("băm mật khẩu có salt và chỉ xác nhận đúng mật khẩu", () => { const hash = hashPassword("MatKhauNoiBo!2026"); expect(hash).not.toContain("MatKhauNoiBo!2026"); expect(verifyPassword("MatKhauNoiBo!2026", hash)).toBe(true); expect(verifyPassword("sai-mat-khau", hash)).toBe(false); });
});
