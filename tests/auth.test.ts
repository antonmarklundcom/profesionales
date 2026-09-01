import { beforeAll, describe, expect, it } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-session-signing";
});

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("una-clave-segura");
    expect(hash).not.toContain("una-clave-segura");
    await expect(verifyPassword("una-clave-segura", hash)).resolves.toBe(true);
    await expect(verifyPassword("otra-clave", hash)).resolves.toBe(false);
  });

  it("refuses to hash a password that is too short", async () => {
    await expect(hashPassword("corta")).rejects.toThrow();
  });

  it("treats a missing hash as a failed login, never a crash", async () => {
    await expect(verifyPassword("x", "")).resolves.toBe(false);
  });
});

describe("session cookie", () => {
  it("round-trips a signed payload", async () => {
    const token = await signSession({ userId: 7, role: "admin", email: "admin@example.com" });
    const payload = await verifySession(token);
    expect(payload).toMatchObject({ userId: 7, role: "admin", email: "admin@example.com" });
  });

  it("rejects a tampered payload — a professional cannot forge an admin session", async () => {
    const token = await signSession({ userId: 7, role: "professional", email: "pro@example.com" });
    const [body, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString());
    decoded.role = "admin";
    const forgedBody = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(await verifySession(`${forgedBody}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession({ userId: 1, role: "admin", email: "a@b.c" });
    process.env.AUTH_SECRET = "a-completely-different-secret";
    expect(await verifySession(token)).toBeNull();
    process.env.AUTH_SECRET = "test-secret-for-session-signing";
  });

  it("rejects expired, empty and malformed tokens", async () => {
    const expired = await signSession({ userId: 1, role: "admin", email: "a@b.c" }, -60);
    expect(await verifySession(expired)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("not-a-token")).toBeNull();
    expect(await verifySession("only-one-part.")).toBeNull();
  });

  it("cookies are httpOnly, lax and scoped to the whole site", () => {
    const options = sessionCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });
});
