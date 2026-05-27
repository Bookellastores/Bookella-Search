/** Shared helpers for book source adapters (server + client). */

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function normalizeCover(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

export function fallbackCoverFromIsbn(isbn: string | undefined): string {
  if (!isbn?.trim()) return "";
  const clean = isbn.replace(/[^0-9X]/gi, "");
  if (clean.length < 10) return "";
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(clean)}-L.jpg`;
}

export function extractISBN(
  identifiers: { type?: string; identifier?: string }[] | undefined
): string {
  if (!identifiers?.length) return "";
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
  return isbn13?.identifier || isbn10?.identifier || "";
}

export function detectLanguage(langs: string[] | undefined): string {
  if (!langs?.length) return "";
  if (langs.includes("ara") || langs.includes("ar")) return "عربي";
  if (langs.includes("eng") || langs.includes("en")) return "إنجليزي";
  return langs[0] || "";
}

export function langFromCode(code: string | undefined): string {
  if (!code) return "";
  if (code === "ar") return "عربي";
  if (code === "en") return "إنجليزي";
  return code;
}

export function pickBestCover(candidates: string[], isbn?: string): string {
  const valid = candidates
    .map(normalizeCover)
    .filter((u) => u.length > 12);
  const scored = valid.map((url) => {
    let score = 0;
    if (url.includes("books.google") || url.includes("googleusercontent")) score += 4;
    if (url.includes("openlibrary.org")) score += 3;
    if (url.includes("archive.org/services/img")) score -= 2;
    if (url.includes("placeholder")) score -= 5;
    return { url, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.url || fallbackCoverFromIsbn(isbn);
}
