import { NextResponse } from "next/server";
import { mergeToEnrichedMetadata } from "@/lib/bookMetadataMerge";
import type { EnrichedBookMetadata, UnifiedBook } from "@/lib/bookTypes";
import { enrichMetadataWithGemini } from "@/lib/geminiEnrichment";
import { fetchBookMetadataFromLibraries, searchAllLibraries } from "@/lib/bookSources";

export const dynamic = "force-dynamic";

function pickRicher(
  client: EnrichedBookMetadata | null,
  server: EnrichedBookMetadata | null
): EnrichedBookMetadata | null {
  if (!client) return server;
  if (!server) return client;

  return {
    title: server.title || client.title,
    author: server.author !== "غير معروف" ? server.author : client.author,
    category: server.category || client.category,
    pageCount: server.pageCount > 0 ? server.pageCount : client.pageCount,
    isbn: server.isbn || client.isbn,
    coverImage: server.coverImage || client.coverImage,
    publisher: server.publisher || client.publisher,
    language: server.language || client.language,
    arabicSummary:
      server.arabicSummary.length > client.arabicSummary.length
        ? server.arabicSummary
        : client.arabicSummary,
    sourcesUsed: Array.from(new Set([...client.sourcesUsed, ...server.sourcesUsed])),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body?.title?.trim();
    const clientMetadata = body?.clientMetadata as EnrichedBookMetadata | undefined;
    const clientBooks = (body?.clientBooks as UnifiedBook[] | undefined) || [];

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "يرجى إدخال اسم الكتاب" }, { status: 400 });
    }

    const enhancedBy: string[] = [];
    if (clientMetadata || clientBooks.length) enhancedBy.push("المتصفح");

    let allBooks: UnifiedBook[] = [...clientBooks];

    // محاولة جلب إضافي من السيرفر (يعمل على Vercel أو عند توفر SSL صحيح)
    try {
      const { books: serverBooks } = await searchAllLibraries(title, "all");
      if (serverBooks.length) {
        allBooks = [...allBooks, ...serverBooks];
        enhancedBy.push("مكتبات السيرفر");
      }
    } catch {
      /* تجاهل — الاعتماد على بيانات المتصفح */
    }

    let metadata =
      mergeToEnrichedMetadata(allBooks, title) ||
      clientMetadata ||
      (await fetchBookMetadataFromLibraries(title));

    if (clientMetadata) {
      metadata = pickRicher(clientMetadata, metadata);
    }

    if (!metadata) {
      return NextResponse.json(
        {
          error:
            "لم نجد بيانات لهذا الكتاب. جرّب الاسم بالإنجليزية أو أضف اسم المؤلف.",
        },
        { status: 404 }
      );
    }

    if (process.env.GEMINI_API_KEY?.trim() && allBooks.length > 0) {
      const geminiResult = await enrichMetadataWithGemini(title, allBooks, metadata);
      if (geminiResult) {
        metadata = geminiResult;
        enhancedBy.push("Gemini AI");
      }
    }

    if (process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
      enhancedBy.push("Google Books API");
    }

    return NextResponse.json({
      ...metadata,
      coverImage: metadata.coverImage,
      enhancedBy: Array.from(new Set(enhancedBy)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("Fetch book error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات الكتاب", details: message },
      { status: 500 }
    );
  }
}
