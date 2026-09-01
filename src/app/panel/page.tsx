import { eq } from "drizzle-orm";
import { db } from "@/db";
import { professionals } from "@/db/schema";
import { requireProfessionalPage } from "@/lib/auth/guards";
import { t } from "@/lib/i18n";

export const metadata = { title: t("panel.title") };
export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const session = await requireProfessionalPage();

  const [profile] = await db
    .select()
    .from(professionals)
    .where(eq(professionals.userId, session.userId))
    .limit(1);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t("panel.welcome", { name: profile?.businessName ?? session.email })}</h1>

      {profile && !profile.verifiedAt ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{t("panel.unverified_notice")}</p>
      ) : null}

      <dl className="rounded-lg border border-slate-200 bg-white p-5">
        <dt className="text-sm text-[var(--color-muted)]">{t("panel.credit_balance")}</dt>
        <dd className="text-2xl font-semibold">
          Gs {new Intl.NumberFormat("es-PY").format(profile?.creditBalanceGs ?? 0)}
        </dd>
      </dl>

      {/* Leads inbox, ledger view and profile editor arrive in phase opus-3 (plan §5.3). */}
      <p className="text-sm text-[var(--color-muted)]">{t("panel.leads_inbox")}: —</p>
    </section>
  );
}
