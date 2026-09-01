import Link from "next/link";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">{brand.name}</p>
      <h1 className="text-3xl font-bold">{t("home.title")}</h1>
      <p className="text-[var(--color-muted)]">{t("home.intro")}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/ingresar"
          className="rounded-lg bg-[var(--color-brand)] px-5 py-3 font-medium text-white"
        >
          {t("auth.login_title")}
        </Link>
      </div>
    </main>
  );
}
