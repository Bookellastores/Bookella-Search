/**
 * Server-side book library search (for API routes / deployment).
 * On machines with SSL issues, the dashboard uses bookSourcesClient instead.
 */
import { buildPublisherSearchQueries } from "./arabicPublishers";
import { mergeToEnrichedMetadata } from "./bookMetadataMerge";
import type { EnrichedBookMetadata, LibrarySourceKey, UnifiedBook } from "./bookTypes";

export type { UnifiedBook, EnrichedBookMetadata, LibrarySourceKey } from "./bookTypes";
export { mergeToEnrichedMetadata } from "./bookMetadataMerge";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function safeFetchJson(
  url: string,
  timeoutMs = 15000
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    clearTimeout(timeout);
    if (process.env.NODE_ENV === "development") {
      console.warn(`[bookSources] fetch failed for ${url}:`, err);
    }
    return null;
  }
}

function extractISBN(identifiers: { type?: string; identifier?: string }[] | undefined): string {
  if (!identifiers?.length) return "";
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
  return isbn13?.identifier || isbn10?.identifier || "";
}

function detectLanguage(langs: string[] | undefined): string {
  if (!langs?.length) return "";
  if (langs.includes("ara") || langs.includes("ar")) return "عربي";
  if (langs.includes("eng") || langs.includes("en")) return "إنجليزي";
  return langs[0] || "";
}

function langFromCode(code: string | undefined): string {
  if (!code) return "";
  if (code === "ar") return "عربي";
  if (code === "en") return "إنجليزي";
  return code;
}

function normalizeCover(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

function fallbackCoverFromIsbn(isbn: string | undefined): string {
  if (!isbn) return "";
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
}

function googleBooksKey(): string {
  return process.env.GOOGLE_BOOKS_API_KEY
    ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}`
    : "";
}

export async function searchGoogleBooks(query: string, maxResults = 10): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}${googleBooksKey()}`
  );
  const items = data?.items as Record<string, unknown>[] | undefined;
  if (!items?.length) return [];

  return items.map((item, idx) => {
    const info = (item.volumeInfo || {}) as Record<string, unknown>;
    const imageLinks = info.imageLinks as Record<string, string> | undefined;
    const isbn = extractISBN(info.industryIdentifiers as { type?: string; identifier?: string }[]);
    const thumb = normalizeCover(
      imageLinks?.thumbnail || imageLinks?.smallThumbnail || fallbackCoverFromIsbn(isbn)
    );

    return {
      id: `google-${item.id || idx}`,
      title: String(info.title || "عنوان غير معروف"),
      author: Array.isArray(info.authors) ? info.authors.join("، ") : "مؤلف غير معروف",
      category: Array.isArray(info.categories) ? String(info.categories[0]) : "",
      pageCount: Number(info.pageCount) || 0,
      language: langFromCode(String(info.language || "")),
      publisher: String(info.publisher || ""),
      coverUrl: thumb,
      description: String(info.description || "").slice(0, 300),
      isbn,
      publishedDate: String(info.publishedDate || ""),
      source: "Google Books",
      sourceIcon: "📚",
      previewLink: String(info.previewLink || info.infoLink || ""),
    };
  });
}

export async function searchOpenLibrary(query: string, limit = 10): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  const docs = data?.docs as Record<string, unknown>[] | undefined;
  if (!docs?.length) return [];

  return docs.map((doc, idx) => {
    const coverId = doc.cover_i as number | undefined;
    return {
      id: `openlibrary-${doc.key || idx}`,
      title: String(doc.title || "عنوان غير معروف"),
      author: Array.isArray(doc.author_name)
        ? (doc.author_name as string[]).join("، ")
        : "مؤلف غير معروف",
      category: Array.isArray(doc.subject)
        ? (doc.subject as string[]).slice(0, 2).join("، ")
        : "",
      pageCount: Number(doc.number_of_pages_median) || 0,
      language: detectLanguage(doc.language as string[] | undefined),
      publisher: Array.isArray(doc.publisher) ? String(doc.publisher[0]) : "",
      coverUrl: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : fallbackCoverFromIsbn(Array.isArray(doc.isbn) ? String(doc.isbn[0]) : ""),
      description: "",
      isbn: Array.isArray(doc.isbn) ? String(doc.isbn[0]) : "",
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : "",
      source: "Open Library",
      sourceIcon: "📖",
      previewLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
    };
  });
}

export async function searchITBooks(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://api.itbook.store/1.0/search/${encodeURIComponent(query)}`
  );
  const books = data?.books as Record<string, unknown>[] | undefined;
  if (!books?.length) return [];

  return books.slice(0, 6).map((book, idx) => ({
    id: `itbooks-${book.isbn13 || idx}`,
    title: String(book.title || "عنوان غير معروف"),
    author: String(book.authors || "مؤلف غير معروف"),
    category: "تقنية / برمجة",
    pageCount: parseInt(String(book.pages), 10) || 0,
    language: "إنجليزي",
    publisher: String(book.publisher || ""),
    coverUrl: String(book.image || ""),
    description: String(book.desc || "").slice(0, 300),
    isbn: String(book.isbn13 || ""),
    publishedDate: String(book.year || ""),
    source: "IT Bookstore",
    sourceIcon: "💻",
    previewLink: String(book.url || ""),
  }));
}

export async function searchGutendex(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://gutendex.com/books/?search=${encodeURIComponent(query)}`
  );
  const results = data?.results as Record<string, unknown>[] | undefined;
  if (!results?.length) return [];

  return results.slice(0, 8).map((book, idx) => {
    const authors = book.authors as { name?: string }[] | undefined;
    const formats = book.formats as Record<string, string> | undefined;
    return {
      id: `gutenberg-${book.id || idx}`,
      title: String(book.title || "عنوان غير معروف"),
      author: authors?.map((a) => a.name).filter(Boolean).join("، ") || "مؤلف غير معروف",
      category: "أدب كلاسيكي",
      pageCount: 0,
      language: "إنجليزي",
      publisher: "Project Gutenberg",
      coverUrl: formats?.["image/jpeg"] || formats?.["image/png"] || "",
      description: "",
      isbn: "",
      publishedDate: "",
      source: "Project Gutenberg",
      sourceIcon: "📜",
      previewLink: `https://www.gutenberg.org/ebooks/${book.id}`,
    };
  });
}

export async function searchInternetArchive(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:texts&fl[]=identifier,title,creator,description,language,publisher,date&rows=8&output=json`
  );
  const response = data?.response as { docs?: Record<string, unknown>[] } | undefined;
  const docs = response?.docs;
  if (!docs?.length) return [];

  return docs.map((doc, idx) => {
    const id = String(doc.identifier || idx);
    const creators = doc.creator;
    const author = Array.isArray(creators)
      ? creators.join("، ")
      : String(creators || "مؤلف غير معروف");

    return {
      id: `archive-${id}`,
      title: String(doc.title || "عنوان غير معروف"),
      author,
      category: "أرشيف",
      pageCount: 0,
      language: detectLanguage(doc.language as string[] | undefined),
      publisher: String(doc.publisher || "Internet Archive"),
      coverUrl: `https://archive.org/services/img/${id}`,
      description: String(doc.description || "").slice(0, 300),
      isbn: "",
      publishedDate: String(doc.date || ""),
      source: "Internet Archive",
      sourceIcon: "🏛️",
      previewLink: `https://archive.org/details/${id}`,
    };
  });
}

export async function searchWikidata(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=ar|en&format=json&type=item&limit=8`
  );
  const search = data?.search as { id?: string; label?: string; description?: string }[] | undefined;
  if (!search?.length) return [];

  return search
    .filter((item) => item.label)
    .map((item, idx) => ({
      id: `wikidata-${item.id || idx}`,
      title: item.label || "عنوان غير معروف",
      author: "—",
      category: item.description || "",
      pageCount: 0,
      language: "",
      publisher: "",
      coverUrl: "",
      description: item.description || "",
      isbn: "",
      publishedDate: "",
      source: "Wikidata",
      sourceIcon: "🌐",
      previewLink: item.id ? `https://www.wikidata.org/wiki/${item.id}` : "",
    }));
}

export async function searchLibraryOfCongress(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://www.loc.gov/search/?q=${encodeURIComponent(query)}&fo=json&c=8&at=results`
  );
  const results = data?.results as Record<string, unknown>[] | undefined;
  if (!results?.length) return [];

  return results
    .filter((r) => r.title)
    .map((item, idx) => {
      const creators = item.creator as string[] | string | undefined;
      const author = Array.isArray(creators)
        ? creators.join("، ")
        : String(creators || "مؤلف غير معروف");
      const image = item.image_url as string[] | string | undefined;
      const cover = Array.isArray(image) ? image[0] : image || "";
      const originalFormat = item.original_format as string[] | undefined;
      const subject = item.subject as string[] | undefined;

      return {
        id: `loc-${item.id || idx}`,
        title: String(item.title || "عنوان غير معروف"),
        author,
        category: String(originalFormat?.[0] || subject?.[0] || ""),
        pageCount: 0,
        language: "",
        publisher: "",
        coverUrl: String(cover).startsWith("http") ? String(cover) : "",
        description: String(
          (Array.isArray(item.description) ? item.description[0] : item.description) || ""
        ).slice(0, 300),
        isbn: "",
        publishedDate: String(item.date || ""),
        source: "Library of Congress",
        sourceIcon: "🇺🇸",
        previewLink: String(item.url || item.id || ""),
      };
    });
}

export async function searchBookBrainz(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://bookbrainz.org/ws/2/search?query=${encodeURIComponent(query)}&type=work&limit=8`
  );
  const hits = (data as { hits?: { hits?: { _source?: Record<string, unknown> }[] } })?.hits?.hits;
  if (!hits?.length) return [];

  return hits.map((hit, idx) => {
    const src = hit._source || {};
    const authors = src.authors as { name?: string }[] | undefined;
    return {
      id: `bookbrainz-${src.bbid || idx}`,
      title: String(src.title || "عنوان غير معروف"),
      author: authors?.map((a) => a.name).filter(Boolean).join("، ") || "مؤلف غير معروف",
      category: "",
      pageCount: 0,
      language: "",
      publisher: "",
      coverUrl: "",
      description: String(src.disambiguation || ""),
      isbn: "",
      publishedDate: "",
      source: "BookBrainz",
      sourceIcon: "🧠",
      previewLink: src.bbid ? `https://bookbrainz.org/work/${src.bbid}` : "",
    };
  });
}

export async function searchCrossref(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=10&select=DOI,title,author,publisher,published-print,type,ISBN`
  );
  const items = (data?.message as { items?: Record<string, unknown>[] } | undefined)?.items;
  if (!items?.length) return [];

  return items
    .filter((item) => String(item.type || "").includes("book"))
    .map((item, idx) => {
      const titles = item.title as string[] | undefined;
      const authors = item.author as { given?: string; family?: string }[] | undefined;
      const isbns = item.ISBN as string[] | undefined;
      const isbn = isbns?.[0] || "";
      const yearParts =
        ((item["published-print"] as { "date-parts"?: number[][] } | undefined)?.["date-parts"] ||
          [])[0] || [];
      return {
        id: `crossref-${item.DOI || idx}`,
        title: titles?.[0] || "عنوان غير معروف",
        author:
          authors?.map((a) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean).join("، ") ||
          "مؤلف غير معروف",
        category: "كتاب منشور",
        pageCount: 0,
        language: "",
        publisher: String(item.publisher || ""),
        coverUrl: fallbackCoverFromIsbn(isbn),
        description: "",
        isbn,
        publishedDate: yearParts[0] ? String(yearParts[0]) : "",
        source: "Crossref",
        sourceIcon: "🧾",
        previewLink: item.DOI ? `https://doi.org/${item.DOI}` : "",
      };
    });
}

export async function searchNYPL(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://api.repo.nypl.org/api/v2/items/search?q=${encodeURIComponent(query)}&per_page=10`
  );
  const result = (data?.nyplAPI as { response?: { result?: Record<string, unknown>[] } })?.response
    ?.result;
  if (!result?.length) return [];

  return result.map((item, idx) => {
    const uuid = String(item.uuid || idx);
    const title = String(item.title || "عنوان غير معروف");
    const imageId = item.image_id as string | undefined;
    return {
      id: `nypl-${uuid}`,
      title,
      author: "—",
      category: "مكتبة نيويورك العامة",
      pageCount: 0,
      language: "",
      publisher: "NYPL",
      coverUrl: imageId
        ? `https://images.nypl.org/index.php?id=${imageId}&t=r`
        : "",
      description: "",
      isbn: "",
      publishedDate: "",
      source: "NYPL",
      sourceIcon: "🗽",
      previewLink: `https://digitalcollections.nypl.org/items/${uuid}`,
    };
  });
}

export async function searchDPLA(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://api.dp.la/v2/items?q=${encodeURIComponent(query)}&page_size=10`
  );
  const docs = (data?.docs as Record<string, unknown>[]) || [];
  if (!docs.length) return [];

  return docs
    .map((doc, idx) => {
      const sourceResource = (doc.sourceResource || {}) as Record<string, unknown>;
      const titleField = sourceResource.title;
      const title = Array.isArray(titleField)
        ? String(titleField[0] || "")
        : String(titleField || "");
      if (!title) return null;

      const creator = sourceResource.creator;
      const author = Array.isArray(creator)
        ? (creator as string[]).join("، ")
        : String(creator || "مؤلف غير معروف");

      const identifier = sourceResource.identifier as Record<string, unknown> | undefined;
      const isbn = Array.isArray(identifier?.isbn)
        ? String((identifier?.isbn as string[])[0])
        : String(identifier?.isbn || "");

      const publisher = sourceResource.publisher;
      const publisherName = Array.isArray(publisher)
        ? String(publisher[0] || "")
        : String(publisher || "");

      return {
        id: `dpla-${doc.id || idx}`,
        title,
        author,
        category: "أرشيف رقمي",
        pageCount: 0,
        language: "",
        publisher: publisherName,
        coverUrl: fallbackCoverFromIsbn(isbn),
        description: "",
        isbn,
        publishedDate: "",
        source: "DPLA",
        sourceIcon: "🇺🇸",
        previewLink: String(doc.isShownAt || doc.object || ""),
      };
    })
    .filter((b): b is UnifiedBook => Boolean(b));
}

export async function searchOpenAlexBooks(query: string): Promise<UnifiedBook[]> {
  const data = await safeFetchJson(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=type:book|book-chapter&per-page=10`
  );
  const results = data?.results as Record<string, unknown>[] | undefined;
  if (!results?.length) return [];

  return results.map((item, idx) => {
    const authorships = item.authorships as
      | { author?: { display_name?: string } }[]
      | undefined;
    const ids = item.ids as Record<string, string> | undefined;
    const isbn = ids?.isbn || "";
    const primaryLocation = item.primary_location as
      | { source?: { display_name?: string } }
      | undefined;

    return {
      id: `openalex-${item.id || idx}`,
      title: String(item.display_name || "عنوان غير معروف"),
      author:
        authorships
          ?.map((a) => a.author?.display_name)
          .filter(Boolean)
          .slice(0, 4)
          .join("، ") || "مؤلف غير معروف",
      category: "Academic Book",
      pageCount: 0,
      language: "",
      publisher: primaryLocation?.source?.display_name || "",
      coverUrl: fallbackCoverFromIsbn(isbn),
      description: "",
      isbn,
      publishedDate: item.publication_year ? String(item.publication_year) : "",
      source: "OpenAlex",
      sourceIcon: "🎓",
      previewLink: String(item.id || ""),
    };
  });
}

export const ALL_LIBRARY_SOURCES: {
  key: LibrarySourceKey;
  label: string;
  icon: string;
  search: (q: string) => Promise<UnifiedBook[]>;
}[] = [
  { key: "google", label: "Google Books", icon: "📚", search: searchGoogleBooks },
  { key: "openlibrary", label: "Open Library", icon: "📖", search: searchOpenLibrary },
  { key: "itbooks", label: "IT Bookstore", icon: "💻", search: searchITBooks },
  { key: "gutenberg", label: "Project Gutenberg", icon: "📜", search: searchGutendex },
  { key: "archive", label: "Internet Archive", icon: "🏛️", search: searchInternetArchive },
  { key: "wikidata", label: "Wikidata", icon: "🌐", search: searchWikidata },
  { key: "loc", label: "Library of Congress", icon: "🇺🇸", search: searchLibraryOfCongress },
  { key: "bookbrainz", label: "BookBrainz", icon: "🧠", search: searchBookBrainz },
  { key: "crossref", label: "Crossref", icon: "🧾", search: searchCrossref },
  { key: "openalex", label: "OpenAlex", icon: "🎓", search: searchOpenAlexBooks },
  { key: "nypl", label: "NYPL", icon: "🗽", search: searchNYPL },
  { key: "dpla", label: "DPLA", icon: "🇺🇸", search: searchDPLA },
];

/** مصادر مناسبة لكتب الأوريجينال (دور نشر / فهارس رسمية). */
export const PUBLISHER_LIBRARY_KEYS = new Set<LibrarySourceKey>([
  "google",
  "openlibrary",
  "crossref",
  "loc",
  "bookbrainz",
]);

export async function fetchBookMetadataFromLibraries(
  title: string,
  sourceFilter: LibrarySourceKey | "all" = "all",
  publisherHint?: string
): Promise<EnrichedBookMetadata | null> {
  const { books } = await searchAllLibraries(title, sourceFilter);
  if (/[\u0600-\u06FF]/.test(title)) {
    const ar = await searchGoogleBooks(`${title} lang:ar`, 5);
    books.push(...ar);
  }
  const publisherQueries = buildPublisherSearchQueries(title, publisherHint);
  for (const pq of publisherQueries) {
    const pubHits = await searchGoogleBooks(pq, 3);
    books.push(...pubHits);
  }
  return mergeToEnrichedMetadata(books, title);
}

export async function searchAllLibraries(
  query: string,
  sourceFilter: LibrarySourceKey | "all" = "all"
): Promise<{ books: UnifiedBook[]; sourceSummary: Record<string, number> }> {
  const sources =
    sourceFilter === "all"
      ? ALL_LIBRARY_SOURCES
      : ALL_LIBRARY_SOURCES.filter((s) => s.key === sourceFilter);

  const results = await Promise.allSettled(sources.map((s) => s.search(query)));
  const allBooks: UnifiedBook[] = [];
  const sourceSummary: Record<string, number> = {};

  results.forEach((result, idx) => {
    const name = sources[idx].label;
    if (result.status === "fulfilled" && result.value?.length) {
      allBooks.push(...result.value);
      sourceSummary[name] = result.value.length;
    } else {
      sourceSummary[name] = 0;
    }
  });

  return { books: allBooks, sourceSummary };
}
