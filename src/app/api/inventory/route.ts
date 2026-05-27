import { NextResponse } from "next/server";
import { INVENTORY_COLLECTION, INVENTORY_DOC_ID, getDb, isMongoConfigured } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ books: [], storage: "local" });
  }

  try {
    const db = await getDb();
    const doc = await db
      .collection(INVENTORY_COLLECTION)
      .findOne({ docKey: INVENTORY_DOC_ID });
    const books = Array.isArray(doc?.books) ? doc.books : [];
    return NextResponse.json({
      books,
      storage: "mongodb",
      updatedAt: doc?.updatedAt || null,
      count: books.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: message, books: [], storage: "error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const books = body?.books;

    if (!Array.isArray(books)) {
      return NextResponse.json({ error: "يجب إرسال مصفوفة books" }, { status: 400 });
    }

    if (!isMongoConfigured()) {
      return NextResponse.json({
        ok: true,
        storage: "local",
        message: "MongoDB غير مفعّل — يتم الحفظ محلياً في المتصفح فقط",
        count: books.length,
      });
    }

    const db = await getDb();
    await db.collection(INVENTORY_COLLECTION).updateOne(
      { docKey: INVENTORY_DOC_ID },
      {
        $set: {
          docKey: INVENTORY_DOC_ID,
          books,
          updatedAt: new Date().toISOString(),
          count: books.length,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      storage: "mongodb",
      count: books.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("Inventory PUT error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
