import type { EnrichedBookMetadata, UnifiedBook } from "./bookTypes";

function similarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = na.split(/\s+/);
  const wordsB = new Set(nb.split(/\s+/));
  const overlap = wordsA.filter((w) => wordsB.has(w)).length;
  return overlap / Math.max(wordsA.length, wordsB.size, 1);
}

function pickBestMatch(books: UnifiedBook[], query: string): UnifiedBook | null {
  if (!books.length) return null;
  const scored = books.map((b) => ({
    book: b,
    score: similarity(b.title, query) + (b.coverUrl ? 0.1 : 0) + (b.pageCount > 0 ? 0.05 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0.15 ? scored[0].book : books[0];
}

function firstNonEmpty(...values: (string | undefined | null)[]): string {
  for (const v of values) {
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

function firstPositive(...nums: number[]): number {
  for (const n of nums) {
    if (n > 0) return n;
  }
  return 0;
}

export function mergeToEnrichedMetadata(
  books: UnifiedBook[],
  queryTitle: string
): EnrichedBookMetadata | null {
  if (!books.length) return null;

  const best = pickBestMatch(books, queryTitle);
  if (!best) return null;

  const sameTitle = books.filter((b) => similarity(b.title, queryTitle) >= 0.45);
  const pool = sameTitle.length ? sameTitle : books;
  const sourcesUsed = Array.from(new Set(pool.map((b) => b.source)));

  const coverCandidates = pool.map((b) => b.coverUrl).filter((u) => u && u.length > 10);
  const preferredCover = coverCandidates.find((u) => !u.includes("archive.org/services/img"));
  const coverImage = preferredCover || coverCandidates[0] || best.coverUrl || null;

  const description = firstNonEmpty(...pool.map((b) => b.description));
  const arabicSummary = description
    ? description.length > 280
      ? description.slice(0, 277) + "..."
      : description
    : `كتاب بعنوان «${best.title}»${best.author && best.author !== "مؤلف غير معروف" ? ` للمؤلف ${best.author}` : ""}.`;

  return {
    title: best.title,
    author: firstNonEmpty(...pool.map((b) => b.author), best.author) || "غير معروف",
    category: firstNonEmpty(...pool.map((b) => b.category), best.category) || "عام",
    pageCount: firstPositive(...pool.map((b) => b.pageCount), best.pageCount) || 250,
    isbn: firstNonEmpty(...pool.map((b) => b.isbn)) || null,
    coverImage,
    publisher: firstNonEmpty(...pool.map((b) => b.publisher), best.publisher),
    language: firstNonEmpty(...pool.map((b) => b.language), best.language) || "عربي",
    arabicSummary,
    sourcesUsed,
  };
}
