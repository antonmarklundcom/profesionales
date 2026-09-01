import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";
import { t } from "@/lib/i18n";

export const metadata = { title: t("auth.login_title") };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const session = await getSession();
  if (session) redirect(session.role === "admin" ? "/admin" : "/panel");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold">{t("auth.login_title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("auth.login_subtitle")}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form method="post" action="/api/auth/login" className="flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.password")}
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-5 py-3 font-medium text-white">
          {t("auth.submit")}
        </button>
      </form>
    </main>
  );
}
