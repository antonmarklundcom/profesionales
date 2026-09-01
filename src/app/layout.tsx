import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: t("common.brand_tagline"),
  metadataBase: new URL(brand.siteUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PY">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
