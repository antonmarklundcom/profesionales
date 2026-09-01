import Link from "next/link";
import { t } from "@/lib/i18n";

export const metadata = { title: t("errors.forbidden_title") };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">{t("errors.forbidden_title")}</h1>
      <p className="text-[var(--color-muted)]">{t("errors.forbidden_body")}</p>
      <Link href="/" className="text-[var(--color-brand)] underline">
        {t("common.back")}
      </Link>
    </main>
  );
}
