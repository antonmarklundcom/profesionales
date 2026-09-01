import { createHash, randomBytes, randomInt } from "node:crypto";

/** Unambiguous alphabet: no 0/O/1/I/L so codes survive being read over WhatsApp. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Short, unguessable, human-readable code (leads.public_code). */
export function publicCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** Unguessable URL-safe token (accept links, review links, spoke tokens). */
export function secureToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Storage form for bearer tokens — the plaintext is shown once and never stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * URL slug from arbitrary Spanish text: accents folded, ñ preserved as "n",
 * everything else collapsed to single hyphens.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

/**
 * Make a slug unique against slugs already taken, by appending -2, -3, ...
 * Callers pass the existing set; the DB unique index is the real guarantee.
 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const slug = slugify(base) || "profesional";
  const used = new Set(taken);
  if (!used.has(slug)) return slug;
  let n = 2;
  while (used.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

/**
 * Normalize a Paraguayan phone number to E.164 (+595XXXXXXXXX).
 * Accepts 0981123456, 981123456, +595 981 123 456, 595981123456.
 * Returns null when the input cannot be a Paraguayan mobile/landline number.
 */
export function normalizeParaguayanPhone(input: string): string | null {
  const digits = (input || "").replace(/[^\d]/g, "");
  if (!digits) return null;

  let national: string;
  if (digits.startsWith("595")) national = digits.slice(3);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;

  national = national.replace(/^0+/, "");
  // Paraguayan national numbers are 8–9 digits after the trunk prefix.
  if (national.length < 8 || national.length > 9) return null;
  return `+595${national}`;
}

/** wa.me deep link with an optional prefilled message (plan §1.6). */
export function whatsappLink(phone: string, message?: string): string | null {
  const normalized = normalizeParaguayanPhone(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized.replace("+", "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
