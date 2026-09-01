/**
 * Brand and domain are configuration, never hardcoded (plan §1.13) — the same
 * engine may later serve a second customer-facing door.
 *
 * These read NEXT_PUBLIC_* vars, so they are inlined at build time and safe to
 * use in both server and client components.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Profesionales",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_BRAND_WHATSAPP || "",
} as const;

export function absoluteUrl(path: string): string {
  return `${brand.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
