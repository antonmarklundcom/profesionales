import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = schema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
    next: form.get("next") ? String(form.get("next")) : undefined,
  });

  if (!parsed.success) {
    return redirectWithError(request, t("auth.invalid_credentials"));
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return redirectWithError(request, t("auth.invalid_credentials"));
  }

  if (user.status === "suspended") {
    return redirectWithError(request, t("auth.account_suspended"));
  }

  const token = await signSession({ userId: user.id, role: user.role, email: user.email });

  // Only same-origin relative paths are honoured, so `next` cannot be used as an
  // open redirect into another site.
  const requested = parsed.data.next;
  const safeNext =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : user.role === "admin"
        ? "/admin"
        : "/panel";

  const response = NextResponse.redirect(new URL(safeNext, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/ingresar", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}
