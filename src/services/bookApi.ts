// src/services/bookApi.ts

/**
 * Service layer for fetching book metadata from various APIs.
 * Provides two public functions:
 *   - fetchOriginalPublisherBooks(query): fetches books using only publisher‑trusted sources.
 *   - fetchHighCopyBooks(query): fetches books from any source (including free APIs).
 *
 * All API keys are read from environment variables prefixed with REACT_APP_.
 * If a key is missing, the function gracefully falls back to the next available source.
 *
 * The functions return a normalized array of BookInfo objects defined in src/types/book.ts.
 */

import { BookInfo } from "../types/book";

// Helper to construct query URLs with optional API keys
const withKey = (url: string, key?: string) => (key ? `${url}&key=${key}` : url);

// Google Books (client side) – requires REACT_APP_GOOGLE_BOOKS_KEY (optional)
const fetchGoogleBooks = async (query: string): Promise<BookInfo[]> => {
  const key = process.env.REACT_APP_GOOGLE_BOOKS_KEY;
  const url = withKey(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`,
    key
  );
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map((item: any) => {
    const info = item.volumeInfo;
    const industry = info.industryIdentifiers?.find((i: any) => i.type === "ISBN_13")?.identifier || "";
    return {
      title: info.title || "",
      authors: info.authors?.join(", ") || "",
      publisher: info.publisher || "",
      isbn: industry,
      coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") || "",
      description: info.description || "",
      pageCount: info.pageCount || 0,
      language: info.language || "",
      source: "Google Books",
    } as BookInfo;
  });
};

// Open Library – public, no key needed
const fetchOpenLibrary = async (query: string): Promise<BookInfo[]> => {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || []).map((doc: any) => {
    const isbn = doc.isbn?.[0] || "";
    const coverUrl = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
      : "";
    return {
      title: doc.title || "",
      authors: doc.author_name?.join(", ") || "",
      publisher: doc.publisher?.[0] || "",
      isbn,
      coverUrl,
      description: doc.first_sentence?.join(" ") || "",
      pageCount: doc.number_of_pages_median || 0,
      language: doc.language?.[0] || "",
      source: "Open Library",
    } as BookInfo;
  });
};

// ISBNdb – requires REACT_APP_ISBNDB_KEY (optional)
const fetchISBNdb = async (query: string): Promise<BookInfo[]> => {
  const key = process.env.REACT_APP_ISBNDB_KEY;
  if (!key) return [];
  const url = `https://api.isbndb.com/books/${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Authorization": key },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const book = data.book;
  return [
    {
      title: book.title || "",
      authors: book.authors?.join(", ") || "",
      publisher: book.publisher || "",
      isbn: book.isbn13 || book.isbn10 || "",
      coverUrl: book.image || "",
      description: book.synopsis || "",
      pageCount: book.pages || 0,
      language: book.language || "",
      source: "ISBNdb",
    } as BookInfo,
  ];
};

// Goodreads – requires REACT_APP_GOODREADS_KEY (optional). Uses public API via cors‑anywhere fallback.
const fetchGoodreads = async (query: string): Promise<BookInfo[]> => {
  const key = process.env.REACT_APP_GOODREADS_KEY;
  if (!key) return [];
  // Goodreads API is XML; we rely on a helper endpoint that converts to JSON.
  const proxy = "https://api.allorigins.win/raw?url=";
  const url = `https://www.goodreads.com/search/index.xml?key=${key}&q=${encodeURIComponent(query)}`;
  const res = await fetch(proxy + encodeURIComponent(url));
  if (!res.ok) return [];
  const text = await res.text();
  // Very light parsing – extract title and author via regex (fallback).
  const matches = [...text.matchAll(/<best_book>.*?<title>(.*?)<\/title>.*?<author>.*?<name>(.*?)<\/name>.*?<image_url>(.*?)<\/image_url>/gs)];
  return matches.map((m) => ({
    title: m[1] || "",
    authors: m[2] || "",
    coverUrl: m[3] || "",
    publisher: "",
    isbn: "",
    description: "",
    pageCount: 0,
    language: "",
    source: "Goodreads",
  } as BookInfo));
};

// Amazon Product Advertising – requires REACT_APP_AMAZON_PA_KEY and SECRET (omitted for brevity).
// Placeholder – returns empty array.
const fetchAmazonPA = async (_query: string): Promise<BookInfo[]> => [];

// Public helper to deduplicate books by ISBN (or title if ISBN missing)
const dedupe = (books: BookInfo[]): BookInfo[] => {
  const map = new Map<string, BookInfo>();
  for (const b of books) {
    const key = b.isbn || b.title.toLowerCase();
    if (!map.has(key)) map.set(key, b);
  }
  return Array.from(map.values());
};

/**
 * Fetch books using only trusted publisher sources.
 * Order of preference: Google Books (client), ISBNdb, Open Library (as fallback).
 */
export const fetchOriginalPublisherBooks = async (query: string): Promise<BookInfo[]> => {
  const results: BookInfo[] = [];
  // Try Google Books first – it often contains publisher info.
  const google = await fetchGoogleBooks(query);
  results.push(...google);
  // Fallback to ISBNdb if a key is provided.
  const isbndb = await fetchISBNdb(query);
  results.push(...isbndb);
  // Finally, Open Library as a safety net.
  const open = await fetchOpenLibrary(query);
  results.push(...open);
  return dedupe(results);
};

/**
 * Fetch books from any available source (including free APIs).
 */
export const fetchHighCopyBooks = async (query: string): Promise<BookInfo[]> => {
  const results: BookInfo[] = [];
  const google = await fetchGoogleBooks(query);
  results.push(...google);
  const open = await fetchOpenLibrary(query);
  results.push(...open);
  const isbndb = await fetchISBNdb(query);
  results.push(...isbndb);
  const goodreads = await fetchGoodreads(query);
  results.push(...goodreads);
  // Amazon PA placeholder can be added later.
  return dedupe(results);
};

/**
 * Fetch a high‑resolution cover image for a given ISBN.
 * Attempts Open Library first, then Google Books.
 */
export const fetchCoverImageByISBN = async (isbn: string): Promise<string> => {
  if (!isbn) return "";
  // Open Library cover service
  const openUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  try {
    const head = await fetch(openUrl, { method: "HEAD" });
    if (head.ok) return openUrl;
  } catch {}
  // Google Books fallback – use search endpoint to retrieve thumbnail.
  const googleKey = process.env.REACT_APP_GOOGLE_BOOKS_KEY;
  const url = withKey(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
    googleKey
  );
  try {
    const res = await fetch(url);
    const data = await res.json();
    const item = data.items?.[0];
    return item?.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://") || "";
  } catch { return ""; }
};
