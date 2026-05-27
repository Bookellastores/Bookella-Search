// src/services/bookMetadataService.ts
// Centralized service for fetching book metadata from various sources.
// Supports Google Books API, Open Library API, ISBNdb API (requires API key), and fallback to minimal data.

import fetch from 'node-fetch';

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
}

// Helper to push source name into array without duplicates
const addSource = (arr: string[] | undefined, src: string) => {
  const list = arr ?? [];
  if (!list.includes(src)) list.push(src);
  return list;
};

// Google Books API (public endpoint, no key required for basic usage)
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
      coverImage: volume.imageLinks?.thumbnail,
      publisher: volume.publisher,
      language: volume.language,
      isbn: volume.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier,
      sourcesUsed: addSource(undefined, 'Google Books'),
    };
  } catch (e) {
    return null;
  }
};

// Open Library API (no key required)
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
        coverImage: book.cover?.large || book.cover?.medium || book.cover?.small,
        language: book.languages?.[0]?.key?.split('/')?.pop(),
        isbn: isbnMatch[0],
        sourcesUsed: addSource(undefined, 'Open Library'),
      };
    } else {
      const doc = data.docs?.[0];
      if (!doc) return null;
      return {
        title: doc.title,
        author: doc.author_name?.[0],
        publisher: doc.publisher?.[0],
        pageCount: doc.number_of_pages_median,
        coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
        language: doc.language?.[0],
        isbn: doc.isbn?.[0],
        sourcesUsed: addSource(undefined, 'Open Library'),
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
      coverImage: book.image,
      language: book.language,
      isbn: book.isbn,
      sourcesUsed: addSource(undefined, 'ISBNdb'),
    };
  } catch (e) {
    return null;
  }
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
