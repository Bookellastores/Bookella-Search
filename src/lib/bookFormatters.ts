const CATEGORY_AR_MAP: Record<string, string> = {
  fiction: "رواية",
  "juvenile fiction": "أدب أطفال",
  biography: "سيرة ذاتية",
  history: "تاريخ",
  religion: "ديني",
  philosophy: "فلسفة",
  psychology: "علم نفس",
  "self-help": "تطوير الذات",
  "self help": "تطوير الذات",
  education: "تعليم",
  science: "علوم",
  poetry: "شعر",
  drama: "مسرح",
  comics: "قصص مصورة",
  fantasy: "فانتازيا",
  mystery: "غموض",
  thriller: "إثارة",
  romance: "رومانسية",
  business: "أعمال",
  economics: "اقتصاد",
  law: "قانون",
  medicine: "طب",
  technology: "تقنية",
  computers: "حاسوب",
};

export function normalizeAuthorName(author: string): string {
  let trimmed = (author || "").trim();
  if (!trimmed) return "غير معروف";
  
  // Handle Arabic and English commas
  if (!trimmed.includes(",") && !trimmed.includes("،")) return trimmed;

  // Replace Arabic comma with English comma for splitting
  trimmed = trimmed.replace(/،/g, ",");
  
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`.replace(/\s+/g, " ").trim();
  }
  return trimmed;
}

export function translateCategoryToArabic(category: string): string {
  const raw = (category || "").trim();
  if (!raw) return "عام";
  if (/[\u0600-\u06FF]/.test(raw)) return raw;

  const key = raw.toLowerCase();
  for (const [en, ar] of Object.entries(CATEGORY_AR_MAP)) {
    if (key === en || key.includes(en)) return ar;
  }
  return raw;
}

export function shouldPreferExistingCategory(existing: string, incoming: string): boolean {
  const inc = translateCategoryToArabic(incoming);
  if (!inc) return true;
  if (/[\u0600-\u06FF]/.test(existing) && !/[\u0600-\u06FF]/.test(inc)) return true;
  return false;
}

export function generateNextBookId(books: { id: string }[]): string {
  let max = 0;
  for (const b of books) {
    const m = b.id.match(/BOO-(\d+)/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `BOO-${max + 1}`;
}
