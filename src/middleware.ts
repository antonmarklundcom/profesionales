/**
 * First line of defence on the role-gated route groups. It rejects on the signed
 * cookie alone (no DB access in the Edge runtime) — the server-side guards in
 * `src/lib/auth/guards.ts` are what actually protect data.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const ADMIN_PREFIX = "/admin";
const PANEL_PREFIX = "/panel";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const login = request.nextUrl.clone();
    login.pathname = "/ingresar";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith(ADMIN_PREFIX) && session.role !== "admin") {
    const denied = request.nextUrl.clone();
    denied.pathname = "/sin-acceso";
    denied.search = "";
    return NextResponse.redirect(denied);
  }

  if (pathname.startsWith(PANEL_PREFIX) && session.role !== "professional") {
    const denied = request.nextUrl.clone();
    denied.pathname = "/sin-acceso";
    denied.search = "";
    return NextResponse.redirect(denied);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel/:path*"],
};
