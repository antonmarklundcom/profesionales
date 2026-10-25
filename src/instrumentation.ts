import { assertProductionEnv } from "@/lib/env";

/**
 * Runs once per server boot. A production deploy missing DATABASE_URL or
 * AUTH_SECRET would otherwise fail later with an opaque runtime error — on
 * Hostinger that shows up as a generic "Application error" page with no cause.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return; // builds need no secrets

  const problems = assertProductionEnv();
  if (problems.length > 0) {
    console.error("✖ Configuración de producción incompleta:");
    for (const problem of problems) console.error(`   - ${problem}`);
    console.error("   Revisá hPanel → Environment Variables y volvé a desplegar (docs: README).");
    // Stop the server: booting on the public dev fallbacks would let anyone
    // forge an admin session or log in with the default password.
    throw new Error(`Configuración de producción incompleta: ${problems.join("; ")}`);
  }
}
