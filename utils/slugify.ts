const COMBINING_MARK_RANGE_START = 0x0300;
const COMBINING_MARK_RANGE_END = 0x036f;

/**
 * Wandelt einen beliebigen String in einen URL-sicheren Slug um
 * (Kleinschreibung, keine Akzente, Wörter durch Bindestriche getrennt).
 *
 * Beispiel: "Scarlet & Violet—151" -> "scarlet-violet-151"
 */
export function slugify(value: string): string {
  const withoutDiacritics = Array.from(value.normalize("NFKD"))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARK_RANGE_START || code > COMBINING_MARK_RANGE_END;
    })
    .join("");

  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
