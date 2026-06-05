import type { EnrichedBookMetadata } from "./bookTypes";
import {
  normalizeAuthorName,
  shouldPreferExistingCategory,
  translateCategoryToArabic,
} from "./bookFormatters";
import { fallbackCoverFromIsbn } from "./bookSourceUtils";

export interface InventoryBook {
  id: string;
  charGroup: string;
  title: string;
  type: string;
  author: string;
  category: string;
  series: string;
  subCategories: string;
  originalPrice: number;
  price: number;
  discountedPrice?: number;
  quantity: number;
  language: string;
  publisher: string;
  pageCount: number;
  coverUrl: string;
  notes: string;
  isbn: string;
  libraryName: string;
  lastRefreshedAt?: number;
}

function isEmpty(val: string | number | undefined | null): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === "number") return val === 0;
  return String(val).trim() === "";
}

/** دمج كامل مع الحفاظ على الأسعار */
export function mergeBookWithMetadata(
  book: InventoryBook,
  meta: EnrichedBookMetadata
): InventoryBook {
  const author = meta.author ? normalizeAuthorName(meta.author) : book.author;
  const category = shouldPreferExistingCategory(book.category, meta.category || "")
    ? book.category
    : translateCategoryToArabic(meta.category || book.category);

  return {
    ...book,
    charGroup: book.charGroup,
    title: book.title,
    author:
      author && author !== "غير معروف" && author !== "مؤلف غير معروف" ? author : book.author,
    category,
    pageCount: meta.pageCount > 0 ? meta.pageCount : book.pageCount,
    coverUrl: meta.coverImage || book.coverUrl || fallbackCoverFromIsbn(meta.isbn || book.isbn),
    publisher: meta.publisher || book.publisher,
    language: meta.language || book.language,
    notes: meta.arabicSummary || book.notes,
    isbn: meta.isbn || book.isbn,
    originalPrice: book.originalPrice,
    price: book.price,
    discountedPrice: book.discountedPrice,
    quantity: book.quantity,
    lastRefreshedAt: Date.now(),
  };
}

/** يملأ الحقول الفارغة فقط — لا يمسح بيانات موجودة (مهم للشيت والتحديث الآمن) */
export function mergeBookFillMissing(
  book: InventoryBook,
  patch: Partial<InventoryBook>
): InventoryBook {
  const merged: InventoryBook = { ...book };

  if (!isEmpty(patch.title) && isEmpty(book.title)) merged.title = String(patch.title);
  if (!isEmpty(patch.author) && (isEmpty(book.author) || book.author === "غير معروف")) {
    merged.author = normalizeAuthorName(String(patch.author));
  }
  if (
    !isEmpty(patch.category) &&
    (isEmpty(book.category) || book.category === "عام" || book.category === "رواية")
  ) {
    merged.category = translateCategoryToArabic(String(patch.category));
  } else if (!isEmpty(patch.category) && !shouldPreferExistingCategory(book.category, String(patch.category))) {
    merged.category = translateCategoryToArabic(String(patch.category));
  }
  if (!isEmpty(patch.series) && isEmpty(book.series)) merged.series = String(patch.series);
  if (!isEmpty(patch.subCategories) && isEmpty(book.subCategories)) {
    merged.subCategories = String(patch.subCategories);
  }
  if (!isEmpty(patch.publisher) && isEmpty(book.publisher)) merged.publisher = String(patch.publisher);
  if (!isEmpty(patch.language) && isEmpty(book.language)) merged.language = String(patch.language);
  if (!isEmpty(patch.isbn) && isEmpty(book.isbn)) merged.isbn = String(patch.isbn);
  if (!isEmpty(patch.notes) && isEmpty(book.notes)) merged.notes = String(patch.notes);
  if (!isEmpty(patch.coverUrl) && isEmpty(book.coverUrl)) merged.coverUrl = String(patch.coverUrl);
  if ((patch.pageCount || 0) > 0 && (book.pageCount || 0) <= 0) merged.pageCount = Number(patch.pageCount);
  if ((patch.quantity || 0) > 0 && (book.quantity || 0) <= 0) merged.quantity = Number(patch.quantity);
  if ((patch.originalPrice || 0) > 0 && (book.originalPrice || 0) <= 0) {
    merged.originalPrice = Number(patch.originalPrice);
  }
  if ((patch.price || 0) > 0 && (book.price || 0) <= 0) merged.price = Number(patch.price);
  if (!isEmpty(patch.libraryName) && isEmpty(book.libraryName)) {
    merged.libraryName = String(patch.libraryName);
  }
  if (!isEmpty(patch.type) && isEmpty(book.type)) merged.type = String(patch.type);

  return merged;
}
