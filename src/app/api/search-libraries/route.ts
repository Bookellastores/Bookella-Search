import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import {
  searchAllLibraries,
  type LibrarySourceKey,
} from "@/lib/bookSources";

const VALID_SOURCES = new Set<LibrarySourceKey | "all">([
  "all",
  "google",
  "openlibrary",
  "itbooks",
  "gutenberg",
  "archive",
  "wikidata",
  "loc",
  "bookbrainz",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const sourceParam = (searchParams.get("source") || "all") as LibrarySourceKey | "all";

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "يرجى إدخال كلمة بحث لا تقل عن حرفين" },
        { status: 400 }
      );
    }

    const sourceFilter = VALID_SOURCES.has(sourceParam) ? sourceParam : "all";
    const { books, sourceSummary } = await searchAllLibraries(query, sourceFilter);

    return NextResponse.json({
      query,
      totalResults: books.length,
      sourceSummary,
      books,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("Multi-library search error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء البحث في المكتبات: " + message },
      { status: 500 }
    );
  }
}
