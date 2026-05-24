import { NextResponse } from "next/server";

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

    // Extract sheet ID from full URL if provided
    let spreadsheetId = spreadsheetIdInput.trim();
    if (spreadsheetId.includes("docs.google.com/spreadsheets")) {
      const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        spreadsheetId = match[1];
      }
    }

    // Generate public CSV Export URL (accessible if "anyone with link can view" or published)
    let csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    if (sheetName) {
      csvUrl += `&sheet=${encodeURIComponent(sheetName)}`;
    }

    const response = await fetch(csvUrl, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { message: "فشل سحب البيانات. تأكد من أن ملف Google Sheet متاح للعرض العام (anyone with link can view) ومن صحة المعرف." },
        { status: 400 }
      );
    }

    const text = await response.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "لم نجد أي صفوف بيانات صالحة بجدول البيانات." },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    // Map headers intelligently to support custom user columns (Arabic and English)
    const titleIdx = findHeaderIndex(headers, ["اسم الكتاب", "العنوان", "title", "book name", "booktitle", "الاسم", "الكتب"]);
    const authorIdx = findHeaderIndex(headers, ["الكاتب", "المؤلف", "author", "writer", "bookauthor"]);
    const categoryIdx = findHeaderIndex(headers, ["التصنيف الرئيسي", "التصنيف", "القسم", "categoy", "category", "genre"]);
    const originalPriceIdx = findHeaderIndex(headers, ["السعر الأصلي", "شراء", "الشراء", "original price", "cost", "buying price"]);
    const priceIdx = findHeaderIndex(headers, ["السعر الموحد", "السعر", "البيع", "سعر البيع", "price", "selling price", "final price"]);
    const quantityIdx = findHeaderIndex(headers, ["الكمية المتاحة", "الكمية", "العدد", "quantity", "copies", "qty", "stock"]);
    const pageCountIdx = findHeaderIndex(headers, ["عدد الصفحات", "الصفحات", "pages", "page count", "pagescount"]);
    const languageIdx = findHeaderIndex(headers, ["اللغة", "لغة الكتاب", "language", "lang"]);
    const publisherIdx = findHeaderIndex(headers, ["الناشر", "دار النشر", "publisher", "house"]);
    const coverUrlIdx = findHeaderIndex(headers, ["صورة الغلاف", "الغلاف", "رابط الغلاف", "cover", "image", "coverurl", "cover url", "image url"]);
    const notesIdx = findHeaderIndex(headers, ["ملاحظات", "ملاحظة", "notes", "description", "الوصف", "وصف"]);

    const books = dataRows.map((row, rIdx) => {
      const getVal = (idx: number, fallback: string = "") => {
        if (idx === -1 || idx >= row.length) return fallback;
        return row[idx].trim();
      };

      const title = getVal(titleIdx);
      const author = getVal(authorIdx, "غير معروف");
      const category = getVal(categoryIdx, "رواية");
      const origPrice = parseFloat(getVal(originalPriceIdx)) || 40;
      const quantity = parseInt(getVal(quantityIdx)) || 5;
      const pageCount = parseInt(getVal(pageCountIdx)) || 250;
      const language = getVal(languageIdx, "عربي");
      const publisher = getVal(publisherIdx, "");
      const coverUrl = getVal(coverUrlIdx, "");
      const notes = getVal(notesIdx, "");

      // Premium Pricing Formula
      let finalPrice = parseFloat(getVal(priceIdx)) || 0;
      if (!finalPrice) {
        if (origPrice < 30) finalPrice = 50;
        else if (origPrice >= 40 && origPrice <= 50) finalPrice = origPrice + 15;
        else if (origPrice >= 60 && origPrice <= 77) finalPrice = origPrice + 10;
        else finalPrice = origPrice;
      }

      return {
        id: `SHEETS-${Date.now()}-${rIdx}`,
        charGroup: title ? title.charAt(0) : "ا",
        title: title || "عنوان غير مسمى",
        author,
        category,
        originalPrice: origPrice,
        price: finalPrice,
        quantity,
        language,
        publisher,
        pageCount,
        coverUrl,
        notes,
        libraryName: "Google Sheets"
      };
    }).filter(b => b.title && b.title !== "عنوان غير مسمى");

    return NextResponse.json({
      success: true,
      spreadsheetId,
      totalCount: books.length,
      books
    });
  } catch (error: any) {
    console.error("Sheets sync error:", error);
    return NextResponse.json(
      { message: "حدث خطأ فني أثناء قراءة رابط Google Sheets: " + error.message },
      { status: 500 }
    );
  }
}

// Simple and strong CSV content parser
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
        i++; // skip next qualifier
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentVal);
      if (row.length > 0 && row.some(item => item !== "")) {
        result.push(row);
      }
      row = [];
      currentVal = "";
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
    } else {
      currentVal += char;
    }
  }

  // Push remaining elements if exists
  if (currentVal || row.length > 0) {
    row.push(currentVal);
    if (row.some(item => item !== "")) {
      result.push(row);
    }
  }

  return result;
}

function findHeaderIndex(headers: string[], synonyms: string[]): number {
  return headers.findIndex(header => 
    synonyms.some(syn => 
      header.includes(syn.toLowerCase()) || syn.toLowerCase().includes(header)
    )
  );
}
