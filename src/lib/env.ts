/**
 * Env access. Missing optional values never block a build or a boot (plan §4.5) —
 * the feature that needs them degrades gracefully and says so.
 */
function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** Public dev-only fallbacks. They must never be used (or accepted) in a production runtime. */
export const DEV_AUTH_SECRET = "dev-only-insecure-secret-change-me";
export const DEV_ADMIN_PASSWORD = "cambiar-esta-clave";

/**
 * True when the server is running in production — but not while `next build`
 * runs (NODE_ENV is "production" there too), so builds without secrets still work.
 */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

/** Like required(), but the dev fallback is never returned in a production runtime. */
function requiredSecret(name: string, devFallback: string): string {
  return required(name, isProductionRuntime() ? undefined : devFallback);
}

function required(name: string, fallback?: string): string {
  const v = optional(name);
  if (v) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable ${name}`);
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    // Dev fallback keeps `next build` and local runs working without a .env;
    // a production runtime throws instead of using it (see isProductionRuntime).
    return requiredSecret("AUTH_SECRET", DEV_AUTH_SECRET);
  },
  get adminEmail() {
    return required("ADMIN_EMAIL", "admin@profesionales.com.py");
  },
  get adminPassword() {
    return requiredSecret("ADMIN_PASSWORD", DEV_ADMIN_PASSWORD);
  },
  get uploadsDir() {
    return required("UPLOADS_DIR", "./uploads");
  },
  get smtp() {
    const host = optional("SMTP_HOST");
    if (!host) return undefined;
    return {
      host,
      port: Number(optional("SMTP_PORT") ?? 587),
      user: optional("SMTP_USER"),
      password: optional("SMTP_PASSWORD"),
      from: optional("SMTP_FROM") ?? "no-reply@profesionales.com.py",
    };
  },
  get vendercrm() {
    const url = optional("VENDERCRM_API_URL");
    const key = optional("VENDERCRM_API_KEY");
    if (!url || !key) return undefined;
    return { url, key };
  },
  get spokeSeedToken() {
    return optional("SPOKE_SEED_TOKEN");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
} as const;

/** Called from instrumentation on boot: fail loudly rather than silently insecure. */
export function assertProductionEnv(): string[] {
  const problems: string[] = [];
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL is not set");
  if (!process.env.AUTH_SECRET) problems.push("AUTH_SECRET is not set (sessions would use the dev fallback)");
  else if (process.env.AUTH_SECRET === DEV_AUTH_SECRET) problems.push("AUTH_SECRET is the public dev fallback");
  if (!process.env.ADMIN_PASSWORD) problems.push("ADMIN_PASSWORD is not set");
  else if (process.env.ADMIN_PASSWORD === DEV_ADMIN_PASSWORD) problems.push("ADMIN_PASSWORD is the public dev fallback");
  if (!process.env.NEXT_PUBLIC_SITE_URL) problems.push("NEXT_PUBLIC_SITE_URL is not set");
  return problems;
}
