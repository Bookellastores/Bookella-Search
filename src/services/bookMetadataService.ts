// src/services/bookMetadataService.ts
// Centralized service for fetching book metadata from multiple sources with strict
// separation between publisher-trusted sources and wider discovery sources.

export interface BookMetadata {
  title?: string;
  author?: string;
  category?: string;
  pageCount?: number;
  coverImage?: string;
  publisher?: string;
  language?: string;
  isbn?: string;
  arabicSummary?: string;
  sourcesUsed?: string[];
  sourceType?: "publisher" | "general";
}

// Helper to push source name into array without duplicates
const addSource = (arr: string[] | undefined, src: string) => {
  const list = arr ?? [];
  if (!list.includes(src)) list.push(src);
  return list;
};

function normalizeCover(url?: string): string {
  if (!url) return "";
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

function fallbackCoverFromIsbn(isbn?: string): string {
  if (!isbn) return "";
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
}

// Google Books API (publisher-trusted)
export const fetchFromGoogleBooks = async (query: string): Promise<BookMetadata | null> => {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data.items || data.items.length === 0) return null;
    const volume = data.items[0].volumeInfo;
    return {
      title: volume.title,
      author: volume.authors?.[0],
      category: volume.categories?.[0],
      pageCount: volume.pageCount,
      coverImage: normalizeCover(volume.imageLinks?.thumbnail) || fallbackCoverFromIsbn(volume.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier),
      publisher: volume.publisher,
      language: volume.language,
      isbn: volume.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier,
      sourcesUsed: addSource(undefined, 'Google Books'),
      sourceType: "publisher",
    };
  } catch (e) {
    return null;
  }
};

// Open Library API (publisher-trusted catalog)
export const fetchFromOpenLibrary = async (isbnOrTitle: string): Promise<BookMetadata | null> => {
  try {
    // Try ISBN first
    const isbnMatch = isbnOrTitle.match(/\d{10,13}/);
    let url = '';
    if (isbnMatch) {
      url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbnMatch[0]}&jscmd=data&format=json`;
    } else {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(isbnOrTitle)}&limit=1`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (isbnMatch) {
      const key = `ISBN:${isbnMatch[0]}`;
      const book = data[key];
      if (!book) return null;
      return {
        title: book.title,
        author: book.authors?.[0]?.name,
        publisher: book.publishers?.[0]?.name,
        pageCount: book.number_of_pages,
        coverImage: normalizeCover(book.cover?.large || book.cover?.medium || book.cover?.small) || fallbackCoverFromIsbn(isbnMatch[0]),
        language: book.languages?.[0]?.key?.split('/')?.pop(),
        isbn: isbnMatch[0],
        sourcesUsed: addSource(undefined, 'Open Library'),
        sourceType: "publisher",
      };
    } else {
      const doc = data.docs?.[0];
      if (!doc) return null;
      return {
        title: doc.title,
        author: doc.author_name?.[0],
        publisher: doc.publisher?.[0],
        pageCount: doc.number_of_pages_median,
        coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : fallbackCoverFromIsbn(doc.isbn?.[0]),
        language: doc.language?.[0],
        isbn: doc.isbn?.[0],
        sourcesUsed: addSource(undefined, 'Open Library'),
        sourceType: "publisher",
      };
    }
  } catch (e) {
    return null;
  }
};

// ISBNdb API – requires API key defined in env variable ISBNDB_API_KEY
export const fetchFromISBNdb = async (isbn: string): Promise<BookMetadata | null> => {
  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://api.isbndb.com/book/${isbn}`;
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) return null;
    const data: any = await res.json();
    const book = data.book;
    if (!book) return null;
    return {
      title: book.title,
      author: book.authors?.[0],
      publisher: book.publisher,
      pageCount: book.pages,
      coverImage: normalizeCover(book.image) || fallbackCoverFromIsbn(book.isbn13 || book.isbn10),
      language: book.language,
      isbn: book.isbn,
      sourcesUsed: addSource(undefined, 'ISBNdb'),
      sourceType: "publisher",
    };
  } catch (e) {
    return null;
  }
};

// Crossref (wider discovery source)
export const fetchFromCrossref = async (query: string): Promise<BookMetadata | null> => {
  try {
    const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=1&select=DOI,title,author,publisher,published-print,type,ISBN`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const work = data?.message?.items?.find((w: any) => String(w.type || "").includes("book"));
    if (!work) return null;
    const isbn = work.ISBN?.[0];
    return {
      title: work.title?.[0],
      author: work.author?.map((a: any) => [a.given, a.family].filter(Boolean).join(" ")).join(", "),
      publisher: work.publisher,
      isbn,
      coverImage: fallbackCoverFromIsbn(isbn),
      pageCount: 0,
      language: "",
      category: "كتاب منشور",
      sourcesUsed: addSource(undefined, "Crossref"),
      sourceType: "general",
    };
  } catch {
    return null;
  }
};

// OpenAlex (wider discovery source)
export const fetchFromOpenAlex = async (query: string): Promise<BookMetadata | null> => {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=type:book|book-chapter&per-page=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const work = data?.results?.[0];
    if (!work) return null;
    const isbn = work?.ids?.isbn || "";
    return {
      title: work.display_name,
      author: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean).join(", "),
      publisher: work.primary_location?.source?.display_name || "",
      isbn,
      coverImage: fallbackCoverFromIsbn(isbn),
      pageCount: 0,
      language: "",
      category: "Academic Book",
      sourcesUsed: addSource(undefined, "OpenAlex"),
      sourceType: "general",
    };
  } catch {
    return null;
  }
};

// Fetch books only from trusted publisher sources (Google Books, Open Library, ISBNdb). Returns an array of BookMetadata.
export const fetchOriginalPublisherBooks = async (query: string): Promise<BookMetadata[]> => {
  const results: BookMetadata[] = [];
  const google = await fetchFromGoogleBooks(query);
  if (google) results.push(google);
  const open = await fetchFromOpenLibrary(query);
  if (open) results.push(open);
  const isbn = query.replace(/[^0-9X]/gi, "");
  if (isbn.length >= 10) {
    const isbndb = await fetchFromISBNdb(isbn);
    if (isbndb) results.push(isbndb);
  }
  // Keep only entries that look like publisher catalog books.
  const publisherOnly = results.filter((b) => b.sourceType === "publisher");

  // Simple deduplication by ISBN (or title if ISBN missing)
  const seen = new Set<string>();
  const uniq: BookMetadata[] = [];
  for (const b of publisherOnly) {
    const key = b.isbn || b.title || "";
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(b);
    }
  }
  return uniq;
};

// Unified fetch – tries sources in order and merges results.
export const fetchBookMetadata = async (query: string): Promise<BookMetadata> => {
  const sources: ((q: string) => Promise<BookMetadata | null>)[] = [
    fetchFromGoogleBooks,
    fetchFromOpenLibrary,
    // If the query looks like an ISBN, attempt ISBNdb as well
    async (q) => { const isbn = q.replace(/[^0-9X]/gi, ''); return isbn.length >= 10 ? fetchFromISBNdb(isbn) : null; },
  ];

  const aggregated: BookMetadata = {};
  for (const fn of sources) {
    const result = await fn(query);
    if (result) {
      // Merge fields, preferring already set values
      Object.assign(aggregated, result, { sourcesUsed: addSource(aggregated.sourcesUsed, result.sourcesUsed?.[0] ?? '' )});
    }
  }
  return aggregated;
};

export const fetchHighCopyBooks = async (query: string): Promise<BookMetadata[]> => {
  const tasks = [
    fetchFromGoogleBooks(query),
    fetchFromOpenLibrary(query),
    fetchFromCrossref(query),
    fetchFromOpenAlex(query),
  ];
  const resolved = await Promise.all(tasks);
  const books = resolved.filter(Boolean) as BookMetadata[];
  const seen = new Set<string>();
  return books.filter((b) => {
    const key = (b.isbn || b.title || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
