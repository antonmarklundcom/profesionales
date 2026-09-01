import { count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { categories, leads, professionals, zones } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guards";
import { t } from "@/lib/i18n";

export const metadata = { title: t("admin.title") };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdminPage();

  const [[pros], [verified], [activeCategories], [activeZones], [leadCount]] = await Promise.all([
    db.select({ value: count() }).from(professionals),
    db.select({ value: count() }).from(professionals).where(isNotNull(professionals.verifiedAt)),
    db.select({ value: count() }).from(categories).where(eq(categories.active, true)),
    db.select({ value: count() }).from(zones).where(eq(zones.active, true)),
    db.select({ value: count() }).from(leads),
  ]);

  const tiles = [
    { label: t("admin.professionals"), value: `${verified.value} / ${pros.value}` },
    { label: t("admin.leads"), value: leadCount.value },
    { label: t("admin.categories"), value: activeCategories.value },
    { label: t("admin.zones"), value: activeZones.value },
  ];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t("admin.metrics")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">{tile.label}</p>
            <p className="text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </div>
      {/* Verification queue, lead moderation and pricing screens arrive in opus-3 (plan §5.3). */}
    </section>
  );
}
