export interface UnifiedBook {
  id: string;
  title: string;
  author: string;
  category: string;
  pageCount: number;
  language: string;
  publisher: string;
  coverUrl: string;
  description: string;
  isbn: string;
  publishedDate: string;
  source: string;
  sourceIcon: string;
  previewLink: string;
}

export interface EnrichedBookMetadata {
  title: string;
  author: string;
  category: string;
  pageCount: number;
  isbn: string | null;
  coverImage: string | null;
  publisher: string;
  language: string;
  arabicSummary: string;
  sourcesUsed: string[];
}

export type LibrarySourceKey =
  | "google"
  | "openlibrary"
  | "itbooks"
  | "gutenberg"
  | "archive"
  | "wikidata"
  | "loc"
  | "bookbrainz"
  | "crossref"
  | "openalex"
  | "nypl"
  | "dpla";

export type BookSearchMode = "all" | "publisher";
