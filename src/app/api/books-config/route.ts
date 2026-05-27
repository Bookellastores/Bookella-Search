import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** يخبر الواجهة أي مفاتيح API مفعّلة (بدون كشف القيم). */
export async function GET() {
  return NextResponse.json({
    hasGemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    hasGoogleBooksServer: Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim()),
    hasGoogleBooksClient: Boolean(process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY?.trim()),
    hasMongo: Boolean(process.env.MONGODB_URI?.trim()),
  });
}
