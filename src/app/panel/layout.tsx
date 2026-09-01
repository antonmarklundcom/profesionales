import { requireProfessionalPage } from "@/lib/auth/guards";
import { t } from "@/lib/i18n";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireProfessionalPage();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="font-semibold">{t("panel.title")}</span>
        <form method="post" action="/api/auth/logout">
          <span className="mr-4 text-sm text-[var(--color-muted)]">{session.email}</span>
          <button type="submit" className="text-sm underline">
            {t("common.logout")}
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
