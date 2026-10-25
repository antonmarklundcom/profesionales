import { afterEach, describe, expect, it, vi } from "vitest";
import { assertProductionEnv, DEV_ADMIN_PASSWORD, DEV_AUTH_SECRET, env } from "@/lib/env";

/** Seguridad: en producción (runtime) nunca se usan los secretos por defecto públicos. */
function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) vi.stubEnv(k, undefined as unknown as string);
    else vi.stubEnv(k, v);
  }
}

afterEach(() => vi.unstubAllEnvs());

describe("secret getters", () => {
  it("production runtime without AUTH_SECRET / ADMIN_PASSWORD throws", () => {
    setEnv({ NODE_ENV: "production", NEXT_PHASE: undefined, AUTH_SECRET: "", ADMIN_PASSWORD: "" });
    expect(() => env.authSecret).toThrow(/AUTH_SECRET/);
    expect(() => env.adminPassword).toThrow(/ADMIN_PASSWORD/);
  });

  it("production runtime accepts real values", () => {
    setEnv({ NODE_ENV: "production", NEXT_PHASE: undefined, AUTH_SECRET: "real-secret", ADMIN_PASSWORD: "real-pass" });
    expect(env.authSecret).toBe("real-secret");
    expect(env.adminPassword).toBe("real-pass");
  });

  it("development still falls back", () => {
    setEnv({ NODE_ENV: "development", AUTH_SECRET: "", ADMIN_PASSWORD: "" });
    expect(env.authSecret).toBe(DEV_AUTH_SECRET);
    expect(env.adminPassword).toBe(DEV_ADMIN_PASSWORD);
  });

  it("next build phase still falls back (builds need no secrets)", () => {
    setEnv({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build", AUTH_SECRET: "", ADMIN_PASSWORD: "" });
    expect(env.authSecret).toBe(DEV_AUTH_SECRET);
    expect(env.adminPassword).toBe(DEV_ADMIN_PASSWORD);
  });
});

describe("assertProductionEnv", () => {
  const good = {
    DATABASE_URL: "mysql://x",
    NEXT_PUBLIC_SITE_URL: "https://x.test",
    AUTH_SECRET: "real-secret",
    ADMIN_PASSWORD: "real-pass",
  };

  it("passes with real values", () => {
    setEnv(good);
    expect(assertProductionEnv()).toEqual([]);
  });

  it("requires ADMIN_PASSWORD", () => {
    setEnv({ ...good, ADMIN_PASSWORD: "" });
    expect(assertProductionEnv().join()).toMatch(/ADMIN_PASSWORD/);
  });

  it("rejects the public dev fallbacks", () => {
    setEnv({ ...good, AUTH_SECRET: DEV_AUTH_SECRET, ADMIN_PASSWORD: DEV_ADMIN_PASSWORD });
    const problems = assertProductionEnv().join();
    expect(problems).toMatch(/AUTH_SECRET/);
    expect(problems).toMatch(/ADMIN_PASSWORD/);
  });
});

describe("instrumentation register()", () => {
  it("throws in a production runtime with problems, not during build", async () => {
    const { register } = await import("@/instrumentation");
    setEnv({ NEXT_RUNTIME: "nodejs", NODE_ENV: "production", NEXT_PHASE: undefined, DATABASE_URL: "", AUTH_SECRET: "", ADMIN_PASSWORD: "", NEXT_PUBLIC_SITE_URL: "" });
    expect(() => register()).toThrow();
    setEnv({ NEXT_PHASE: "phase-production-build" });
    expect(() => register()).not.toThrow();
  });
});
