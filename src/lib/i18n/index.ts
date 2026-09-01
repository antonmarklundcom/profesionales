/**
 * Typed i18n over locales/*.json (plan §5.1). Every user-facing string is keyed
 * from the first commit; a single `es` locale exists now and the shape allows
 * more later without touching call sites.
 *
 * Keys are dotted paths into the locale JSON and are checked at compile time,
 * so a typo in `t("panel.titel")` fails `npm run typecheck`.
 */
import es from "../../../locales/es.json";

export const locales = { es } as const;
export type Locale = keyof typeof locales;
export const defaultLocale: Locale = "es";

type Primitive = string;
type DottedKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? `${Prefix}${K}`
    : DottedKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = DottedKeys<typeof es>;

function lookup(locale: Locale, key: string): string | undefined {
  const parts = key.split(".");
  let node: unknown = locales[locale];
  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Translate `key`, substituting `{placeholder}` values.
 * A missing key returns the key itself so a gap is visible, never a blank page.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = lookup(locale, key) ?? lookup(defaultLocale, key);
  if (template === undefined) return key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function getTranslator(locale: Locale = defaultLocale) {
  return (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars);
}

/** Default-locale translator; the only thing app code needs today. */
export const t = getTranslator(defaultLocale);
