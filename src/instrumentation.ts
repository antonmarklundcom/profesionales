import { assertProductionEnv } from "@/lib/env";

/**
 * Runs once per server boot. A production deploy missing DATABASE_URL or
 * AUTH_SECRET would otherwise fail later with an opaque runtime error — on
 * Hostinger that shows up as a generic "Application error" page with no cause.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const problems = assertProductionEnv();
  if (problems.length > 0) {
    console.error("✖ Configuración de producción incompleta:");
    for (const problem of problems) console.error(`   - ${problem}`);
    console.error("   Revisá hPanel → Environment Variables y volvé a desplegar (docs: README).");
  }
}
