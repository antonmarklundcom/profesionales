import { describe, expect, it } from "vitest";
import {
  hashToken,
  normalizeParaguayanPhone,
  publicCode,
  secureToken,
  slugify,
  uniqueSlug,
  whatsappLink,
} from "@/lib/ids";

describe("slugify", () => {
  it("folds Spanish accents and lowercases", () => {
    expect(slugify("Aire Acondicionado Asunción")).toBe("aire-acondicionado-asuncion");
    expect(slugify("Ñemby Refrigeración")).toBe("nemby-refrigeracion");
  });

  it("collapses punctuation and trims stray hyphens", () => {
    expect(slugify("  Plomería 24/7 — ¡Urgencias!  ")).toBe("plomeria-24-7-urgencias");
  });

  it("caps length so it always fits the slug column", () => {
    expect(slugify("a".repeat(400))).toHaveLength(160);
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", () => {
    expect(uniqueSlug("Servicios Demo", [])).toBe("servicios-demo");
  });

  it("suffixes until it finds a free slot", () => {
    expect(uniqueSlug("Servicios Demo", ["servicios-demo"])).toBe("servicios-demo-2");
    expect(uniqueSlug("Servicios Demo", ["servicios-demo", "servicios-demo-2"])).toBe("servicios-demo-3");
  });

  it("falls back to a usable slug when the input has no slug characters", () => {
    expect(uniqueSlug("¿¡!", [])).toBe("profesional");
  });
});

describe("tokens and codes", () => {
  it("public codes avoid characters that are ambiguous over WhatsApp", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(publicCode()).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    }
  });

  it("public codes and tokens do not repeat across many draws", () => {
    const codes = new Set(Array.from({ length: 500 }, () => publicCode()));
    expect(codes.size).toBe(500);
    const tokens = new Set(Array.from({ length: 500 }, () => secureToken()));
    expect(tokens.size).toBe(500);
  });

  it("secure tokens are URL-safe base64", () => {
    expect(secureToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashing is stable and one-way in shape", () => {
    const token = secureToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toBe(token);
  });
});

describe("normalizeParaguayanPhone", () => {
  it.each([
    ["0981123456", "+595981123456"],
    ["981123456", "+595981123456"],
    ["+595 981 123 456", "+595981123456"],
    ["595981123456", "+595981123456"],
    ["(0981) 123-456", "+595981123456"],
    ["021 555 123", "+59521555123"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeParaguayanPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "abc", "0981 12", "0981123456789"])("rejects %s", (input) => {
    expect(normalizeParaguayanPhone(input)).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("builds a wa.me link without the plus sign", () => {
    expect(whatsappLink("0981123456")).toBe("https://wa.me/595981123456");
  });

  it("url-encodes the prefilled greeting", () => {
    expect(whatsappLink("0981123456", "Hola, ¿cuánto sale?")).toBe(
      "https://wa.me/595981123456?text=Hola%2C%20%C2%BFcu%C3%A1nto%20sale%3F",
    );
  });

  it("returns null for an unusable number rather than a broken link", () => {
    expect(whatsappLink("no-es-un-numero")).toBeNull();
  });
});
