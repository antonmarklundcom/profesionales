/**
 * Role guards. The exit criterion for phase opus-1 is that a professional
 * cannot reach /admin — proven here at both layers: the middleware that runs
 * before the page, and the server-side guard the page itself calls.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ForbiddenError, requireRole } from "@/lib/auth/guards";
import { SESSION_COOKIE, signSession, type SessionPayload } from "@/lib/auth/session";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-session-signing";
});

const adminSession: SessionPayload = {
  userId: 1,
  role: "admin",
  email: "admin@example.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
};
const proSession: SessionPayload = { ...adminSession, userId: 2, role: "professional", email: "pro@example.com" };

describe("requireRole", () => {
  it("lets an admin into an admin-only surface", () => {
    expect(requireRole(adminSession, ["admin"])).toBe(adminSession);
  });

  it("blocks a professional from an admin-only surface", () => {
    expect(() => requireRole(proSession, ["admin"])).toThrow(ForbiddenError);
  });

  it("blocks an anonymous visitor", () => {
    expect(() => requireRole(null, ["admin"])).toThrow(ForbiddenError);
    expect(() => requireRole(null, ["professional"])).toThrow(ForbiddenError);
  });

  it("lets a professional into the professional panel", () => {
    expect(requireRole(proSession, ["professional"])).toBe(proSession);
  });

  it("blocks an admin from the professional panel (no professionals row exists)", () => {
    expect(() => requireRole(adminSession, ["professional"])).toThrow(ForbiddenError);
  });
});

/** Drives the real middleware with a minimal NextRequest-shaped stub. */
async function runMiddleware(pathname: string, token?: string) {
  const { middleware } = await import("@/middleware");
  const url = new URL(`https://profesionales.test${pathname}`);
  const request = {
    nextUrl: Object.assign(url, { clone: () => new URL(url.toString()) }),
    cookies: { get: (name: string) => (name === SESSION_COOKIE && token ? { value: token } : undefined) },
  };
  return middleware(request as unknown as Parameters<typeof middleware>[0]);
}

describe("middleware route gating", () => {
  it("redirects an anonymous visitor to login, preserving where they were going", async () => {
    const response = await runMiddleware("/admin/profesionales");
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/ingresar");
    expect(location.searchParams.get("next")).toBe("/admin/profesionales");
  });

  it("redirects a professional away from /admin", async () => {
    const token = await signSession({ userId: 2, role: "professional", email: "pro@example.com" });
    const response = await runMiddleware("/admin", token);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/sin-acceso");
  });

  it("lets an admin through to /admin", async () => {
    const token = await signSession({ userId: 1, role: "admin", email: "admin@example.com" });
    const response = await runMiddleware("/admin", token);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an admin away from the professional panel", async () => {
    const token = await signSession({ userId: 1, role: "admin", email: "admin@example.com" });
    const response = await runMiddleware("/panel", token);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/sin-acceso");
  });

  it("lets a professional through to /panel", async () => {
    const token = await signSession({ userId: 2, role: "professional", email: "pro@example.com" });
    const response = await runMiddleware("/panel", token);
    expect(response.headers.get("location")).toBeNull();
  });

  it("a forged admin cookie does not open /admin", async () => {
    const response = await runMiddleware("/admin", "forged.token");
    expect(new URL(response.headers.get("location")!).pathname).toBe("/ingresar");
  });

  it("only /admin and /panel are gated", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toEqual(["/admin/:path*", "/panel/:path*"]);
  });
});

describe("i18n keys used by the guards exist", () => {
  it("resolves the forbidden-page strings", async () => {
    const { t } = await import("@/lib/i18n");
    expect(t("errors.forbidden_title")).not.toBe("errors.forbidden_title");
    expect(t("errors.forbidden_body")).not.toBe("errors.forbidden_body");
  });
});

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
