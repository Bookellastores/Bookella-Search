import type { EnrichedBookMetadata, UnifiedBook } from "./bookTypes";

const GEMINI_MODEL = "gemini-2.0-flash";

export async function enrichMetadataWithGemini(
  queryTitle: string,
  books: UnifiedBook[],
  base: EnrichedBookMetadata
): Promise<EnrichedBookMetadata | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || books.length === 0) return null;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const compactSources = books.slice(0, 20).map((b) => ({
      title: b.title,
      author: b.author,
      category: b.category,
      pageCount: b.pageCount,
      publisher: b.publisher,
      language: b.language,
      coverUrl: b.coverUrl,
      description: b.description?.slice(0, 150),
      isbn: b.isbn,
      source: b.source,
    }));

    const prompt = `أنت خبير بيانات كتب. المستخدم يبحث عن: "${queryTitle}".

البيانات المجمّعة من مكتبات متعددة:
${JSON.stringify(compactSources, null, 0)}

البيانات الحالية المقترحة:
${JSON.stringify(base, null, 0)}

المطلوب:
1. استخرج أدق معلومات للكتاب المطلوب فقط.
2. **ممنوع منعاً باتاً** تغيير اسم الكتاب الأصلي المكتوب في حقل title. أعده كما هو بالضبط.
3. إذا وجدت أن هناك خطأ إملائي واضح في اسم الكتاب (title)، قم بوضعه في حقل "suggestedTitle" كاسم مقترح للتصحيح، وإلا اجعله null.
4. يجب أن يكون التصنيف (category) باللغة العربية فقط (مثل: رواية، تاريخ، تطوير الذات).
5. اكتب ملخصاً عربياً جذاباً من 2-3 جمل (لا تنسخ وصفاً إنجليزياً حرفياً).

أعد JSON فقط بهذا الشكل:
{
  "title": "string (نفس الاسم الأصلي دون تغيير)",
  "suggestedTitle": "string or null",
  "author": "string",
  "category": "string (باللغة العربية فقط)",
  "pageCount": number,
  "isbn": "string or null",
  "coverImage": "string or null",
  "publisher": "string",
  "language": "string",
  "arabicSummary": "string"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const text = response.text?.replace(/^```json/i, "").replace(/```$/i, "").trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as Partial<EnrichedBookMetadata> & {
      coverImage?: string | null;
    };

    return {
      title: base.title, // دائماً نأخذ الاسم الأساسي لمنع تغييره
      suggestedTitle: parsed.suggestedTitle || null,
      author: parsed.author || base.author,
      category: parsed.category || base.category,
      pageCount: parsed.pageCount && parsed.pageCount > 0 ? parsed.pageCount : base.pageCount,
      isbn: parsed.isbn ?? base.isbn,
      coverImage: parsed.coverImage || base.coverImage,
      publisher: parsed.publisher || base.publisher,
      language: parsed.language || base.language,
      arabicSummary: parsed.arabicSummary || base.arabicSummary,
      sourcesUsed: [...base.sourcesUsed, "Gemini AI"],
    };
  } catch (err) {
    console.warn("Gemini enrichment failed:", err);
    return null;
  }
}
