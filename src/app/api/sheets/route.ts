import { NextResponse } from "next/server";
import { normalizeAuthorName } from "@/lib/bookFormatters";

export const dynamic = "force-dynamic";

function buildCsvExportUrl(spreadsheetId: string, sheetName: string): string {
  if (!sheetName.trim()) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }
  // gviz يدعم اسم الورقة؛ export?format=csv يستخدم gid فقط
  if (/^\d+$/.test(sheetName.trim())) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetName.trim()}`;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName.trim())}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spreadsheetIdInput = searchParams.get("spreadsheetId");
    const sheetName = searchParams.get("sheetName") || "";

    if (!spreadsheetIdInput) {
      return NextResponse.json(
        { message: "يرجى تقديم معرف جدول البيانات (Spreadsheet ID) أو رابط Google Sheet" },
        { status: 400 }
      );
    }

    let spreadsheetId = spreadsheetIdInput.trim();
    if (spreadsheetId.includes("docs.google.com/spreadsheets")) {
      const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match?.[1]) spreadsheetId = match[1];
    }

    const csvUrl = buildCsvExportUrl(spreadsheetId, sheetName);
    const response = await fetch(csvUrl, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            "فشل سحب البيانات. تأكد أن الملف «أي شخص لديه الرابط يمكنه العرض» وأن الرابط/المعرّف صحيح.",
        },
        { status: 400 }
      );
    }

    const text = await response.text();
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return NextResponse.json(
        {
          message:
            "الملف غير متاح للتصدير. افتحي المشاركة واختياري «أي شخص لديه الرابط يمكنه العرض».",
        },
        { status: 400 }
      );
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({
        success: true,
        spreadsheetId,
        totalCount: 0,
        books: [],
        message: "لم نجد صفوف بيانات بعد صف العناوين.",
      });
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    const titleIdx = findHeaderIndex(headers, [
      "اسم الكتاب",
      "العنوان",
      "title",
      "book name",
      "booktitle",
      "الاسم",
    ]);
    const authorIdx = findHeaderIndex(headers, [
      "الكاتب",
      "المؤلف",
      "author",
      "writer",
    ]);
    const categoryIdx = findHeaderIndex(headers, [
      "التصنيف الرئيسي",
      "التصنيف",
      "category",
      "genre",
      "القسم",
    ]);
    const typeIdx = findHeaderIndex(headers, ["نوع الكتاب", "type"]);
    const seriesIdx = findHeaderIndex(headers, ["اسم السلسلة", "series"]);
    const subCatIdx = findHeaderIndex(headers, [
      "تصنيفات فرعية",
      "subcategories",
      "sub categories",
    ]);
    const originalPriceIdx = findHeaderIndex(headers, [
      "original price",
      "السعر الأصلي",
      "سعر الشراء",
      "شراء",
      "originalprice",
      "purchase",
    ]);
    const priceIdx = findHeaderIndex(headers, [
      "price",
      "السعر",
      "سعر البيع",
      "السعر الموحد",
      "sale",
    ]);
    const quantityIdx = findHeaderIndex(headers, [
      "الكمية",
      "quantity",
      "qty",
      "stock",
    ]);
    const pageCountIdx = findHeaderIndex(headers, [
      "عدد الصفحات",
      "pagecount",
      "pages",
    ]);
    const languageIdx = findHeaderIndex(headers, ["لغة", "language", "lang"]);
    const publisherIdx = findHeaderIndex(headers, [
      "دار النشر",
      "publisher",
      "الناشر",
    ]);
    const isbnIdx = findHeaderIndex(headers, ["isbn", "ردمك", "barcode"]);
    const coverUrlIdx = findHeaderIndex(headers, [
      "رابط صورة الغلاف",
      "coverurl",
      "cover",
      "image",
    ]);
    const notesIdx = findHeaderIndex(headers, [
      "ملاحظات",
      "notes",
      "description",
    ]);
    const libraryIdx = findHeaderIndex(headers, [
      "اسم المكتبة",
      "library",
      "libraryname",
    ]);
    const charIdx = findHeaderIndex(headers, ["الحرف", "chargroup"]);

    const books = dataRows
      .map((row, rIdx) => {
        const getVal = (idx: number, fallback = "") => {
          if (idx === -1 || idx >= row.length) return fallback;
          return row[idx].trim();
        };

        const title = getVal(titleIdx);
        if (!title) return null;

        const samePriceColumn = originalPriceIdx !== -1 && originalPriceIdx === priceIdx;
        const origPrice = samePriceColumn
          ? 0
          : parseFloat(getVal(originalPriceIdx)) || 0;
        const finalPrice = parseFloat(getVal(priceIdx)) || 0;

        return {
          id: getVal(0).startsWith("BOO-") ? getVal(0) : `SHEETS-${Date.now()}-${rIdx}`,
          charGroup: getVal(charIdx) || title.charAt(0) || "ا",
          title,
          type: getVal(typeIdx) || "",
          author: normalizeAuthorName(getVal(authorIdx, "غير معروف")),
          category: getVal(categoryIdx, "رواية"),
          series: getVal(seriesIdx),
          subCategories: getVal(subCatIdx),
          originalPrice: origPrice,
          price: finalPrice,
          quantity: parseInt(getVal(quantityIdx), 10) || 5,
          language: getVal(languageIdx, "عربي"),
          publisher: getVal(publisherIdx),
          pageCount: parseInt(getVal(pageCountIdx), 10) || 250,
          isbn: getVal(isbnIdx),
          coverUrl: getVal(coverUrlIdx),
          notes: getVal(notesIdx),
          libraryName: getVal(libraryIdx, "Google Sheets"),
        };
      })
      .filter((b): b is NonNullable<typeof b> => Boolean(b));

    return NextResponse.json({
      success: true,
      spreadsheetId,
      totalCount: books.length,
      books,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("Sheets sync error:", error);
    return NextResponse.json(
      { message: "حدث خطأ فني أثناء قراءة Google Sheets: " + message },
      { status: 500 }
    );
  }
}

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      row.push(currentVal);
      if (row.length > 0 && row.some((item) => item !== "")) {
        result.push(row);
      }
      row = [];
      currentVal = "";
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal);
    if (row.some((item) => item !== "")) result.push(row);
  }

  return result;
}

function findHeaderIndex(headers: string[], synonyms: string[]): number {
  return headers.findIndex((header) =>
    synonyms.some(
      (syn) =>
        header === syn.toLowerCase() ||
        header.includes(syn.toLowerCase()) ||
        syn.toLowerCase().includes(header)
    )
  );
}
