/**
 * Server-side access control. Hiding a link is UX; these functions are security.
 * Every server component, action and route handler that reads or mutates
 * privileged data calls one of them — never trust the middleware alone.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/db/schema";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Throws (rather than redirects) so API routes can map it to a 403. */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireRole(session: SessionPayload | null, allowed: UserRole[]): SessionPayload {
  if (!session) throw new ForbiddenError("No session");
  if (!allowed.includes(session.role)) throw new ForbiddenError(`Role ${session.role} not allowed`);
  return session;
}

/** Page-level guard: sends anonymous visitors to login, wrong roles to the 403 page. */
export async function requireRolePage(allowed: UserRole[], loginPath = "/ingresar"): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  if (!allowed.includes(session.role)) redirect("/sin-acceso");
  return session;
}

export const requireAdminPage = () => requireRolePage(["admin"]);
/** `/panel` is professional-only: an admin has no `professionals` row to show. */
export const requireProfessionalPage = () => requireRolePage(["professional"]);
